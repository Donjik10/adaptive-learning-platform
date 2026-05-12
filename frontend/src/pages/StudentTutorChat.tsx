import React, { useEffect, useRef, useState } from "react";
import apiClient from "api/client";
import { useAppSelector } from "store/hooks";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { filename: string; text_snippet: string }[];
}

const StudentTutorChat: React.FC = () => {
  const userId = useAppSelector((s) => s.users.currentId);

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.get("/subjects").then((r) => {
      setCourses(r.data);
      if (r.data.length > 0) setSelectedCourseId(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !userId || !selectedCourseId) return;

    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await apiClient.post("/tutor/ask", {
        user_id: userId,
        course_id: selectedCourseId,
        question: userMsg.content,
      });
      const data = res.data;
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">💬 AI Tutor Chat</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask the AI tutor anything about the course. The tutor answers strictly based on
          the materials uploaded by your teacher.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
        <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-gray-400 mt-12">
              <p className="text-3xl mb-2">💡</p>
              <p>Ask a question about the course material.</p>
              <p className="text-xs mt-1">
                The AI will search the teacher's materials and answer within their guidelines.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                }`}
              >
                {msg.content}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                    <p className="text-xs font-medium text-gray-500">Sources:</p>
                    {msg.sources.map((s, si) => (
                      <div key={si} className="text-xs text-gray-500 flex items-start gap-1">
                        <span>📄</span>
                        <span>
                          <span className="font-medium">{s.filename}</span>
                          {s.text_snippet && (
                            <span className="block text-gray-400 truncate">
                              &ldquo;{s.text_snippet.slice(0, 100)}&hellip;&rdquo;
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-500 animate-pulse">
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleAsk} className="border-t border-gray-200 p-4 flex gap-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Ask about the course material..."
          />
          <button type="submit" disabled={loading || !question.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentTutorChat;
