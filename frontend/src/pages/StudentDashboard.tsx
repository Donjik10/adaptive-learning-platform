import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Assignment,
  listAssignments,
  listSubmissions,
  Submission,
} from "../api/homework";

const StudentDashboard: React.FC = () => {
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

  const getSubmissionForAssignment = (assignmentId: string) =>
    submissions.find((s) => s.assignment_id === assignmentId);

  const getStatusColor = (status?: string) => {
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
        Welcome back, {user?.name}
      </h1>

      <div className="grid gap-4">
        {loading && (
          <p className="text-gray-500">Loading assignments...</p>
        )}

        {!loading && assignments.length === 0 && (
          <p className="text-gray-500">No assignments available.</p>
        )}

        {assignments.map((assignment) => {
          const submission = getSubmissionForAssignment(assignment.id);
          return (
            <div
              key={assignment.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
              onClick={() =>
                submission
                  ? navigate(`/homework/${submission.id}`)
                  : navigate(`/homework/new/${assignment.id}`)
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {assignment.description || "No description"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {assignment.deadline && (
                    <span className="text-xs text-gray-500">
                      Due {new Date(assignment.deadline).toLocaleDateString()}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      submission?.status,
                    )}`}
                  >
                    {submission
                      ? submission.status === "ai_reviewed"
                        ? "AI Reviewed"
                        : submission.status === "reviewed"
                        ? "Reviewed"
                        : "Pending"
                      : "Not Submitted"}
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
