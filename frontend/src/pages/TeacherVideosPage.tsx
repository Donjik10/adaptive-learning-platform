import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { createVideo, Video } from "../api/videos";
import { listAssignments, Assignment } from "../api/homework";

const TeacherVideosPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [sourceType, setSourceType] = useState<"external_link" | "upload">("external_link");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    const res = await listAssignments();
    setAssignments(res.data);
    if (res.data.length > 0) {
      setSelectedCourse(res.data[0].course_id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedCourse || !title.trim()) {
      setMessage({ ok: false, text: "Please fill in all required fields" });
      return;
    }

    if (sourceType === "external_link" && !videoUrl.trim()) {
      setMessage({ ok: false, text: "Please enter a video URL" });
      return;
    }

    setLoading(true);
    try {
      const res = await createVideo({
        course_id: selectedCourse,
        title: title.trim(),
        description: description.trim() || undefined,
        source_type: sourceType,
        external_url: sourceType === "external_link" ? videoUrl.trim() : undefined,
      });
      setVideos((prev) => [...prev, res.data]);
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setMessage({ ok: true, text: "Video added successfully!" });
    } catch (err: any) {
      setMessage({ ok: false, text: err.response?.data?.detail || "Failed to add video" });
    } finally {
      setLoading(false);
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("videos.manage")}</h1>
        <button
          onClick={() => navigate("/videos")}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          {t("back")}
        </button>
      </div>

      {/* Add Video Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t("videos.addVideo")}</h2>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.ok ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("teacher.selectCourse")}</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {assignments.map((a) => (
                <option key={a.course_id} value={a.course_id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("videos.videoTitle")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t("videos.titlePlaceholder")}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("videos.videoDescription")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder={t("videos.descPlaceholder")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("videos.sourceType")}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="external_link"
                  checked={sourceType === "external_link"}
                  onChange={() => setSourceType("external_link")}
                  className="text-indigo-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t("videos.externalLink")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="upload"
                  checked={sourceType === "upload"}
                  onChange={() => setSourceType("upload")}
                  className="text-indigo-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t("videos.uploadFile")}</span>
              </label>
            </div>
          </div>

          {sourceType === "external_link" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("videos.videoUrl")}</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://youtube.com/watch?v=..."
              />
              {videoUrl && isYouTubeUrl(videoUrl) && (
                <div className="mt-3 aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(videoUrl)}`}
                    title="Preview"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {sourceType === "upload" && (
            <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
              <p className="text-gray-500 dark:text-gray-400">{t("videos.uploadComingSoon")}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? t("loading") : t("videos.addVideo")}
          </button>
        </div>
      </form>

      {/* Video List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t("videos.yourVideos")}</h2>
        {videos.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">{t("videos.noVideos")}</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {videos.map((video) => {
            const youtubeId = video.external_url
              ? extractYouTubeId(video.external_url)
              : null;
            return (
              <div key={video.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="aspect-video bg-gray-900">
                  {youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}`}
                      title={video.title}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">🎬</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">{video.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{video.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeacherVideosPage;
