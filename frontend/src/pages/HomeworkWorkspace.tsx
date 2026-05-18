import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
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
  const { t } = useTranslation();
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
        label: "text-xs text-gray-400 dark:text-gray-500 text-right mt-1",
      };
    }
    if (msg.sender_type === "teacher") {
      return {
        container: "flex justify-start",
        bubble: "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300 rounded-r-2xl rounded-tl-2xl px-4 py-2 max-w-md border border-green-200 dark:border-green-800",
        label: "text-xs text-green-600 dark:text-green-400 mt-1",
      };
    }
    // AI Tutor
    return {
      container: "flex justify-start",
      bubble: "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-300 rounded-r-2xl rounded-tl-2xl px-4 py-2 max-w-md border border-purple-200 dark:border-purple-800",
      label: "text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center gap-1",
    };
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reviewed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "ai_reviewed":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      default:
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4 p-4">
      {/* Left Panel — Assignment & Submission */}
      <div className="w-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
        {assignment && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{assignment.title}</h2>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{assignment.description || t("homework.noText")}</p>
            {assignment.deadline && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-2">
                {t("homework.deadline")}: {new Date(assignment.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {submission && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("homework.yourSubmission")}</h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {submission.content_text || t("homework.noText")}
              </p>
            </div>
            
                {/* Attached File */}
                {submission.file_url && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📎</span>
                      <a
                        href={`http://localhost:8000${submission.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {t("homework.attachedFile") || "Attached file"}
                      </a>
                    </div>
                  </div>
                )}
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("status")}:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(submission.status)}`}>
                {getStatusText(submission.status)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel — Chat */}
      <div className="w-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{t("homework.feedbackChat")}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 dark:text-gray-500 text-sm">{t("homework.noMessages")}</p>
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
                        {t("homework.aiTutor")}
                      </>
                    )}
                    {msg.sender_type === "teacher" && t("homework.teacher")}
                    {msg.sender_type === "student" && t("homework.you")}
                    {" — "}
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
          {user?.role === "student" && (
            <button
              onClick={handleAIReview}
              disabled={loading}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>⚡</span> {t("homework.askAI")}
            </button>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("homework.typeMessage")}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {t("send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeworkWorkspace;
