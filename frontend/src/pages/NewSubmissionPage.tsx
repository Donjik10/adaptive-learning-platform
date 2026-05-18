import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "../context/LanguageContext";
import { createSubmission, getAssignment, Assignment, uploadFile } from "../api/homework";

const NewSubmissionPage: React.FC = () => {
  const { t } = useTranslation();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (assignmentId) {
      getAssignment(assignmentId).then((res) => setAssignment(res.data));
    }
  }, [assignmentId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploading(true);
    try {
      const res = await uploadFile(selectedFile);
      setFileUrl(res.data.url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert(t("homework.uploadError") || "File upload failed");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!assignmentId || !content.trim()) return;
    setLoading(true);
    try {
      const res = await createSubmission({
        assignment_id: assignmentId,
        content_text: content,
        file_url: fileUrl || undefined,
      });
      navigate(`/homework/${res.data.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {assignment && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{assignment.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{assignment.description || t("homework.noText")}</p>
          {assignment.deadline && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-2">
              {t("homework.deadline")}: {new Date(assignment.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t("homework.answer")}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder={t("homework.writeSolution")}
        />

        {/* File Upload */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("homework.attachments") || "Attachments"}
          </label>
          
          {fileUrl ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <span className="text-2xl">📎</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("homework.fileAttached") || "File attached"}
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
              >
                {t("delete")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip,.rar"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                <span>📎</span>
                {uploading 
                  ? (t("homework.uploading") || "Uploading...") 
                  : (t("homework.attachFile") || "Attach File")
                }
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {t("homework.maxFileSize") || "Max 10 MB"}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || loading || uploading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? t("loading") : t("homework.submitAssignment")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSubmissionPage;