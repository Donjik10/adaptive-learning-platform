import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createSubmission, getAssignment, Assignment } from "../api/homework";

const NewSubmissionPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      getAssignment(assignmentId).then((res) => setAssignment(res.data));
    }
  }, [assignmentId]);

  const handleSubmit = async () => {
    if (!assignmentId || !content.trim()) return;
    setLoading(true);
    try {
      const res = await createSubmission({
        assignment_id: assignmentId,
        content_text: content,
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{assignment.title}</h1>
          <p className="text-gray-600">{assignment.description || "No description"}</p>
          {assignment.deadline && (
            <p className="text-sm text-red-500 mt-2">
              Deadline: {new Date(assignment.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Answer
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Write your solution here..."
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSubmissionPage;
