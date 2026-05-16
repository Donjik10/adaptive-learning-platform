import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Assignment,
  ChatMessage,
  getAssignment,
  getChatMessages,
  getSubmission,
  postChatMessage,
  requestAIReview,
  Submission,
} from "../api/homework";

interface HomeworkWorkspaceProps {
  submissionId: string;
}

const HomeworkWorkspace: React.FC<HomeworkWorkspaceProps> = ({ submissionId }) => {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [submissionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadData = async () => {
    try {
      setLoading(true);
      const subRes = await getSubmission(submissionId);
      setSubmission(subRes.data);
      const assignRes = await getAssignment(subRes.data.assignment_id);
      setAssignment(assignRes.data);
      const chatRes = await getChatMessages(submissionId);
      setMessages(chatRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const res = await postChatMessage(submissionId, newMessage);
    setMessages((prev) => [...prev, res.data]);
    setNewMessage("");
  };

  const handleAIReview = async () => {
    setLoading(true);
    try {
      const res = await requestAIReview(submissionId);
      setMessages((prev) => [...prev, res.data]);
    } finally {
      setLoading(false);
    }
  };

  const getMessageStyle = (msg: ChatMessage) => {
    if (msg.sender_type === "student") {
      return {
        container: "flex justify-end",
        bubble: "bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl px-4 py-2 max-w-md",
        label: "text-xs text-gray-400 text-right mt-1",
      };
    }
    if (msg.sender_type === "teacher") {
      return {
        container: "flex justify-start",
        bubble: "bg-green-100 text-green-900 rounded-r-2xl rounded-tl-2xl px-4 py-2 max-w-md border border-green-200",
        label: "text-xs text-green-600 mt-1",
      };
    }
    // AI Tutor
    return {
      container: "flex justify-start",
      bubble: "bg-purple-100 text-purple-900 rounded-r-2xl rounded-tl-2xl px-4 py-2 max-w-md border border-purple-200",
      label: "text-xs text-purple-600 mt-1 flex items-center gap-1",
    };
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 p-4">
      {/* Left Panel — Assignment & Submission */}
      <div className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-y-auto">
        {assignment && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{assignment.title}</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{assignment.description || "No description"}</p>
            {assignment.deadline && (
              <p className="text-sm text-red-500 mt-2">
                Deadline: {new Date(assignment.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {submission && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Submission</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-3">
              <p className="text-gray-700 whitespace-pre-wrap">
                {submission.content_text || "(No text submitted)"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  submission.status === "reviewed"
                    ? "bg-green-100 text-green-700"
                    : submission.status === "ai_reviewed"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {submission.status === "ai_reviewed"
                  ? "AI Reviewed"
                  : submission.status === "reviewed"
                  ? "Reviewed"
                  : "Pending"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel — Chat */}
      <div className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Feedback Chat</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm">No messages yet. Start the conversation!</p>
          )}
          {messages.map((msg) => {
            const style = getMessageStyle(msg);
            return (
              <div key={msg.id} className={style.container}>
                <div className="flex flex-col">
                  <div className={style.bubble}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                  </div>
                  <span className={style.label}>
                    {msg.sender_type === "ai_tutor" && (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9V5a1 1 0 112 0v4a1 1 0 01-1 1H9zM9 13a1 1 0 112 0 1 1 0 01-2 0z" />
                        </svg>
                        AI Tutor
                      </>
                    )}
                    {msg.sender_type === "teacher" && "Teacher"}
                    {msg.sender_type === "student" && "You"}
                    {" — "}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 space-y-2">
          {user?.role === "student" && (
            <button
              onClick={handleAIReview}
              disabled={loading}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>⚡</span> Ask AI Assistant
            </button>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeworkWorkspace;
