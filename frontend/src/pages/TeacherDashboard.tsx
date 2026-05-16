import React, { useEffect, useState } from "react";
import apiClient from "api/client";
import { useAuth } from "context/AuthContext";

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [strict, setStrict] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [materials, setMaterials] = useState<any[]>([]);
  const [uploadContent, setUploadContent] = useState("");
  const [uploadFilename, setUploadFilename] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Auth handled by AuthContext

  useEffect(() => {
    apiClient.get("/subjects").then((r) => {
      setCourses(r.data);
      if (r.data.length > 0) setSelectedCourseId(r.data[0].id);
    }).catch((e) => setSaveMsg({ ok: false, text: `Failed to load courses: ${e.message}` }));
  }, []);

  useEffect(() => {
    if (!selectedCourseId || !userId) return;
    apiClient.get(`/teacher/materials/${selectedCourseId}`).then((r) => setMaterials(r.data)).catch(() => {});
    apiClient.get(`/teacher/rules/${userId}/${selectedCourseId}`).then((r) => {
      if (r.data) {
        setPrompt(r.data.ai_persona_prompt ?? "");
        setStrict(r.data.strict_mode_enabled);
      }
    }).catch(() => {});
  }, [selectedCourseId, userId]);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMsg(null);
    if (!userId) { setSaveMsg({ ok: false, text: "No user selected" }); return; }
    if (!selectedCourseId) { setSaveMsg({ ok: false, text: "No course selected" }); return; }
    setSaving(true);
    try {
      const res = await apiClient.put(`/teacher/rules/${userId}`, {
        course_id: selectedCourseId,
        ai_persona_prompt: prompt,
        strict_mode_enabled: strict,
      });
      setSaveMsg({ ok: true, text: `Rule saved! Prompt: "${res.data.ai_persona_prompt}"` });
    } catch (e: any) {
      const detail = e.response?.data?.detail || e.message || "Unknown error";
      const code = e.response?.status ? `HTTP ${e.response.status}` : "";
      console.error("Save rule error:", e);
      setSaveMsg({ ok: false, text: `Error: ${detail} ${code}` });
    }
    setSaving(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadMsg(null);
    if (!userId) { setUploadMsg({ ok: false, text: "No user selected" }); return; }
    if (!selectedCourseId) { setUploadMsg({ ok: false, text: "No course selected" }); return; }
    if (!uploadContent.trim() || !uploadFilename.trim()) { setUploadMsg({ ok: false, text: "Fill in filename and content" }); return; }

    setUploading(true);
    try {
      const res = await apiClient.post("/teacher/materials", {
        teacher_id: userId,
        course_id: selectedCourseId,
        filename: uploadFilename,
        content_text: uploadContent,
      });
      setUploadMsg({ ok: true, text: `"${res.data.filename}" uploaded (${res.data.id.slice(0, 8)}...)` });
      setUploadContent("");
      setUploadFilename("");
      const r = await apiClient.get(`/teacher/materials/${selectedCourseId}`);
      setMaterials(r.data);
    } catch (e: any) {
      const detail = e.response?.data?.detail || e.message || "Unknown error";
      const code = e.response?.status ? `HTTP ${e.response.status}` : "";
      console.error("Upload error:", e);
      setUploadMsg({ ok: false, text: `Error: ${detail} ${code}` });
    }
    setUploading(false);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🧑‍🏫 Teacher Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set the rules for the AI tutor and upload course materials. The AI will work strictly within these boundaries.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
        <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <form onSubmit={handleSaveRule} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">🤖 AI Persona Prompt</h2>
        <p className="text-xs text-gray-400">
          This prompt defines HOW the AI tutor behaves. Example: "Explain like Socrates, ask guiding questions."
        </p>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-y"
          placeholder="e.g. Explain concepts like Socrates, ask guiding questions before giving the answer..."
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Strict mode — AI answers ONLY from uploaded materials
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Rule"}
          </button>
          {saveMsg && (
            <span className={`text-sm ${saveMsg.ok ? "text-green-600" : "text-red-600"}`}>
              {saveMsg.text}
            </span>
          )}
        </div>
      </form>

      <form onSubmit={handleUpload} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">📄 Upload Course Material</h2>
        <p className="text-xs text-gray-400">
          Paste text content or notes for this course. The AI will use this as its knowledge base.
        </p>
        <input value={uploadFilename} onChange={(e) => setUploadFilename(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          placeholder="Filename (e.g. algebra-notes.txt)"
        />
        <textarea value={uploadContent} onChange={(e) => setUploadContent(e.target.value)}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-y font-mono"
          placeholder="Paste your course material here..."
        />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={uploading}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {uploading ? "Uploading & Indexing..." : "Upload Material"}
          </button>
          {uploadMsg && (
            <span className={`text-sm ${uploadMsg.ok ? "text-green-600" : "text-red-600"}`}>
              {uploadMsg.text}
            </span>
          )}
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-gray-900 mb-3">📚 Uploaded Materials ({materials.length})</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-gray-400">No materials uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {materials.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-gray-400">📄</span>
                {m.filename}
                <span className="text-xs text-gray-400">— {new Date(m.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
