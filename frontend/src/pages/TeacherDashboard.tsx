import React, { useEffect, useRef, useState } from "react";
import apiClient from "api/client";
import { useAuth } from "context/AuthContext";
import { useTranslation } from "../context/LanguageContext";

const TeacherDashboard: React.FC = () => {
  const { t } = useTranslation();
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

  // File upload states
  const [uploadMode, setUploadMode] = useState<"text" | "file">("text");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleTextUpload = async (e: React.FormEvent) => {
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

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedCourseId) return;
    
    setFileUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await apiClient.post(
        `/teacher/materials/file?course_id=${selectedCourseId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUploadMsg({ ok: true, text: `"${res.data.filename}" uploaded and indexed` });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const r = await apiClient.get(`/teacher/materials/${selectedCourseId}`);
      setMaterials(r.data);
    } catch (e: any) {
      const detail = e.response?.data?.detail || e.message || "Unknown error";
      console.error("File upload error:", e);
      setUploadMsg({ ok: false, text: `Error: ${detail}` });
    }
    setFileUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">🧑‍🏫 {t("nav.aiRules")}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Set the rules for the AI tutor and upload course materials. The AI will work strictly within these boundaries.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("teacher.selectCourse")}</label>
        <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <form onSubmit={handleSaveRule} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">🤖 {t("teacher.aiPersona")}</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("teacher.aiPersonaHint")}
        </p>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder={t("teacher.personaPlaceholder")}
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          {t("teacher.strictMode")}
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : t("teacher.saveRule")}
          </button>
          {saveMsg && (
            <span className={`text-sm ${saveMsg.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {saveMsg.text}
            </span>
          )}
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">📄 {t("teacher.uploadMaterial")}</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("teacher.uploadHint")}
        </p>

        {/* Upload mode toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setUploadMode("text")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              uploadMode === "text"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            📝 {t("teacher.textUpload") || "Text"}
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              uploadMode === "file"
                ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            📁 {t("teacher.fileUpload") || "File"}
          </button>
        </div>

        {uploadMode === "text" ? (
          <form onSubmit={handleTextUpload} className="space-y-4">
            <input value={uploadFilename} onChange={(e) => setUploadFilename(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder={t("teacher.filenamePlaceholder")}
            />
            <textarea value={uploadContent} onChange={(e) => setUploadContent(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-y font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder={t("teacher.contentPlaceholder")}
            />
            <div className="flex items-center gap-3">
              <button type="submit" disabled={uploading}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {uploading ? "Uploading & Indexing..." : t("teacher.upload")}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.md,.csv,.pdf,.docx,.doc,.json,.xml,.html,.htm"
            />
            
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition"
              >
                <p className="text-3xl mb-2">📁</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("teacher.clickToUpload") || "Click to upload a file"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t("teacher.supportedFormats") || "TXT, PDF, DOCX, MD, CSV, JSON, XML, HTML"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t("teacher.maxFileSize") || "Max 50 MB"}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            )}

            {selectedFile && (
              <button
                type="button"
                onClick={handleFileUpload}
                disabled={fileUploading}
                className="w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
              >
                {fileUploading
                  ? (t("teacher.uploadingIndexing") || "Uploading & Indexing...")
                  : (t("teacher.upload") || "Upload Material")
                }
              </button>
            )}
          </div>
        )}

        {uploadMsg && (
          <span className={`text-sm block ${uploadMsg.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {uploadMsg.text}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">📚 {t("teacher.uploadedMaterials")} ({materials.length})</h2>
        {materials.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">{t("teacher.noMaterials")}</p>
        ) : (
          <ul className="space-y-2">
            {materials.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-gray-400">{m.file_url ? "📎" : "📄"}</span>
                {m.filename}
                <span className="text-xs text-gray-400 dark:text-gray-500">— {new Date(m.created_at).toLocaleDateString()}</span>
                {m.file_url && (
                  <a
                    href={`http://localhost:8000${m.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-2"
                  >
                    {t("download") || "Download"}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;