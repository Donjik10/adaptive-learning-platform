import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import { listAssignments, listSubmissions, Submission, Assignment } from "../api/homework";

const TeacherSubmissions: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [assignRes, subRes] = await Promise.all([
        listAssignments(),
        listSubmissions(),
      ]);
      setAssignments(assignRes.data);
      setSubmissions(subRes.data);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentTitle = (assignmentId: string) => {
    const a = assignments.find((x) => x.id === assignmentId);
    return a?.title || "Unknown Assignment";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reviewed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "ai_reviewed":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ai_reviewed":
        return t("homework.status.aiReviewed");
      case "reviewed":
        return t("homework.status.reviewed");
      default:
        return t("homework.status.pending");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t("nav.teacher")} — {user?.name}
      </h1>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t("teacher.yourAssignments")}</h2>
          <button
            onClick={() => navigate("/teacher/assignments/new")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
          >
            ➕ {t("teacher.createAssignment") || "Create Assignment"}
          </button>
        </div>
        <div className="grid gap-3">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-200">{a.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{a.description || t("homework.noText")}</p>
              </div>
              {a.deadline && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t("homework.deadline")}: {new Date(a.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">{t("teacher.studentSubmissions")}</h2>
        {loading && <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>}
        {!loading && submissions.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">{t("teacher.noSubmissions")}</p>
        )}
        <div className="grid gap-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => navigate(`/homework/${sub.id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">
                    {getAssignmentTitle(sub.assignment_id)}
                  </h3>
                  {sub.file_url && (
                    <span className="text-blue-500 dark:text-blue-400" title={t("homework.hasAttachment") || "Has attachment"}>
                      📎
                    </span>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(sub.status)}`}>
                  {getStatusText(sub.status)}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {sub.content_text || t("homework.noText")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                {new Date(sub.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherSubmissions;
