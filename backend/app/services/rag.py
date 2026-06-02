import json
import math
from uuid import UUID

from httpx import AsyncClient
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.course_material import CourseMaterial
from app.models.document_chunk import DocumentChunk
from app.models.teacher_rule import TeacherRule

OLLAMA_EMBED_URL = f"{settings.OPENAI_BASE_URL}/embeddings" if settings.OPENAI_BASE_URL else ""

CHUNK_SIZE = 400
CHUNK_OVERLAP = 50


class RAGService:
    """
    Retrieval-Augmented Generation service.

    Teacher side:
      - Upload course material → chunk → embed → store
      - Set AI persona prompt & strict mode

    Student side:
      - Ask a question → embed → similarity search → build prompt → LLM → return
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def _embed(self, text: str) -> list[float]:
        url = OLLAMA_EMBED_URL
        if not url:
            raise RuntimeError("OPENAI_BASE_URL must be set for local embeddings")
        is_openai_compat = "/v1/" in url
        async with AsyncClient() as cl:
            body = (
                {"model": settings.OPENAI_MODEL, "input": text}
                if is_openai_compat
                else {"model": settings.OPENAI_MODEL, "prompt": text}
            )
            resp = await cl.post(url, json=body, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            if is_openai_compat:
                return data.get("data", [{}])[0].get("embedding", [])
            return data.get("embedding", [])

    async def upsert_rule(
        self, teacher_id: UUID, course_id: UUID,
        persona_prompt: str | None, strict: bool,
    ) -> TeacherRule:
        result = await self.session.execute(
            select(TeacherRule).where(
                TeacherRule.teacher_id == teacher_id,
                TeacherRule.course_id == course_id,
            ),
        )
        rule = result.scalar_one_or_none()
        if rule is None:
            rule = TeacherRule(teacher_id=teacher_id, course_id=course_id)
            self.session.add(rule)
        rule.ai_persona_prompt = persona_prompt
        rule.strict_mode_enabled = strict
        await self.session.flush()
        return rule

    async def get_rule(self, teacher_id: UUID, course_id: UUID) -> TeacherRule | None:
        result = await self.session.execute(
            select(TeacherRule).where(
                TeacherRule.teacher_id == teacher_id,
                TeacherRule.course_id == course_id,
            ),
        )
        return result.scalar_one_or_none()

    async def upload_material(
        self, teacher_id: UUID, course_id: UUID, filename: str, content: str,
        file_url: str | None = None,
    ) -> CourseMaterial:
        logger.info("Uploading material: {} ({})", filename, len(content.split()), "words")
        mat = CourseMaterial(
            teacher_id=teacher_id,
            course_id=course_id,
            filename=filename,
            content_text=content,
            file_url=file_url,
        )
        self.session.add(mat)
        await self.session.flush()

        chunks = self._chunk_text(content)
        logger.debug("Chunked into {} fragments", len(chunks))
        for i, chunk_text in enumerate(chunks):
            embedding = await self._embed(chunk_text)
            doc = DocumentChunk(
                material_id=mat.id,
                text_chunk=chunk_text,
                token_count=len(chunk_text.split()),
                embedding=json.dumps(embedding),
            )
            self.session.add(doc)
        logger.info("Material {} indexed with {} chunks", mat.id, len(chunks))
        await self.session.flush()
        return mat

    async def list_materials(self, course_id: UUID) -> list[CourseMaterial]:
        result = await self.session.execute(
            select(CourseMaterial)
            .where(CourseMaterial.course_id == course_id)
            .order_by(CourseMaterial.created_at.desc()),
        )
        return list(result.scalars().all())

    async def ask(
        self, user_id: UUID, course_id: UUID, question: str,
    ) -> tuple[str, list[dict]]:
        q_embedding = await self._embed(question)
        chunks = await self._search_similar(q_embedding, course_id, top_k=3)
        rule = await self._get_rule_for_course(course_id)

        persona = rule.ai_persona_prompt if rule else ""
        strict = rule.strict_mode_enabled if rule else True

        system_prompt = (
            "You are an AI tutor in an adaptive learning platform. "
            "Answer the student's question STRICTLY using the provided context materials. "
            "Always cite the source filename for each fact you use."
        )
        if persona:
            system_prompt += f"\n\nThe teacher has given you this instruction: {persona}"

        context_parts = []
        sources = []
        for c in chunks:
            mat = await self.session.get(CourseMaterial, c["material_id"])
            fname = mat.filename if mat else "unknown"
            context_parts.append(f"[Source: {fname}]\n{c['text']}")
            sources.append({"filename": fname, "text_snippet": c["text"][:200]})

        context_block = "\n\n".join(context_parts) if context_parts else ""

        if strict and not context_block:
            return (
                "В предоставленных учителем материалах нет ответа на этот вопрос.",
                [],
            )

        user_prompt = (
            f"## Context materials\n{context_block}\n\n"
            f"## Student question\n{question}\n\n"
            "## Instructions\nAnswer concisely based on the context above."
        )

        if strict:
            user_prompt += (
                "\n\nIMPORTANT: If the answer is NOT found in the context materials, "
                "say exactly: 'В предоставленных учителем материалах нет ответа на этот вопрос.'"
            )

        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key="ollama",
            base_url=settings.OPENAI_BASE_URL,
        ) if settings.OPENAI_BASE_URL else None

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=600,
        )

        answer = response.choices[0].message.content or ""
        return answer, sources

    async def _get_rule_for_course(self, course_id: UUID) -> TeacherRule | None:
        result = await self.session.execute(
            select(TeacherRule).where(TeacherRule.course_id == course_id),
        )
        return result.scalar_one_or_none()

    async def _search_similar(
        self, query_emb: list[float], course_id: UUID, top_k: int = 3,
    ) -> list[dict]:
        result = await self.session.execute(
            select(DocumentChunk)
            .join(CourseMaterial)
            .where(CourseMaterial.course_id == course_id)
        )
        all_chunks: list[DocumentChunk] = list(result.scalars().all())

        scored = []
        for c in all_chunks:
            if not c.embedding:
                continue
            emb = json.loads(c.embedding)
            sim = self._cosine_sim(query_emb, emb)
            scored.append((sim, c.id, c.text_chunk, c.material_id))

        scored.sort(key=lambda x: -x[0])
        return [
            {"id": str(s[1]), "text": s[2], "material_id": s[3], "score": s[0]}
            for s in scored[:top_k]
        ]

    @staticmethod
    def _cosine_sim(a: list[float], b: list[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        na = math.sqrt(sum(x * x for x in a))
        nb = math.sqrt(sum(x * x for x in b))
        return dot / (na * nb) if na and nb else 0.0

    @staticmethod
    def _chunk_text(text: str) -> list[str]:
        words = text.split()
        chunks = []
        start = 0
        while start < len(words):
            end = start + CHUNK_SIZE
            chunk = " ".join(words[start:end])
            chunks.append(chunk)
            start += CHUNK_SIZE - CHUNK_OVERLAP
        return chunks if chunks else [text]
