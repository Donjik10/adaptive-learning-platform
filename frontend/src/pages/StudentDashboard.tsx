import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import {
  Assignment,
  listAssignments,
  listSubmissions,
  Submission,
} from "../api/homework";

const StudentDashboard: React.FC = () => {
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

  const getSubmissionForAssignment = (assignmentId: string) =>
    submissions.find((s) => s.assignment_id === assignmentId);

  const getStatusColor = (status?: string) => {
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

  const getStatusText = (status?: string) => {
    switch (status) {
      case "ai_reviewed":
        return t("homework.status.aiReviewed");
      case "reviewed":
        return t("homework.status.reviewed");
      case "pending":
        return t("homework.status.pending");
      default:
        return t("homework.status.notSubmitted");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t("welcomeBack")}, {user?.name}
      </h1>

      <div className="grid gap-4">
        {loading && (
          <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
        )}

        {!loading && assignments.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">{t("homework.noAssignments")}</p>
        )}

        {assignments.map((assignment) => {
          const submission = getSubmissionForAssignment(assignment.id);
          return (
            <div
              key={assignment.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition cursor-pointer"
              onClick={() =>
                submission
                  ? navigate(`/homework/${submission.id}`)
                  : navigate(`/homework/new/${assignment.id}`)
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{assignment.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                    {assignment.description || t("homework.noText")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {assignment.deadline && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t("homework.deadline")}: {new Date(assignment.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      submission?.status,
                    )}`}
                  >
                    {getStatusText(submission?.status)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentDashboard;
