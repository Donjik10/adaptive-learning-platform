import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listAssignments, listSubmissions, Submission, Assignment } from "../api/homework";

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
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
        return "bg-green-100 text-green-700";
      case "ai_reviewed":
        return "bg-purple-100 text-purple-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Teacher Dashboard — {user?.name}
      </h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Your Assignments</h2>
        <div className="grid gap-3">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium text-gray-800">{a.title}</h3>
                <p className="text-sm text-gray-500">{a.description || "No description"}</p>
              </div>
              {a.deadline && (
                <span className="text-xs text-gray-500">
                  Due {new Date(a.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Student Submissions</h2>
        {loading && <p className="text-gray-500">Loading...</p>}
        {!loading && submissions.length === 0 && (
          <p className="text-gray-500">No submissions yet.</p>
        )}
        <div className="grid gap-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => navigate(`/homework/${sub.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-800">
                  {getAssignmentTitle(sub.assignment_id)}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    sub.status,
                  )}`}
                >
                  {sub.status === "ai_reviewed"
                    ? "AI Reviewed"
                    : sub.status === "reviewed"
                    ? "Reviewed"
                    : "Pending"}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {sub.content_text || "(No text)"}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Submitted {new Date(sub.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
