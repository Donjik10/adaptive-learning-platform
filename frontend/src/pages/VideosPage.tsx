import React, { useEffect, useState } from "react";
import { useTranslation } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { Video, listVideos, deleteVideo } from "../api/videos";
import { listAssignments, Assignment } from "../api/homework";

const VideosPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videoRes, assignRes] = await Promise.all([
        listVideos(),
        listAssignments(),
      ]);
      setVideos(videoRes.data);
      setAssignments(assignRes.data);
      if (assignRes.data.length > 0) {
        setSelectedCourse(assignRes.data[0].course_id);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = selectedCourse
    ? videos.filter((v) => v.course_id === selectedCourse)
    : videos;

  const getCourseName = (courseId: string) => {
    const course = assignments.find((a) => a.course_id === courseId);
    return course?.title || "Unknown Course";
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("delete") + "?")) return;
    await deleteVideo(id);
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("nav.videos")}</h1>
        {isTeacher && (
          <a
            href="/teacher/videos"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
          >
            + {t("teacher.upload")}
          </a>
        )}
      </div>

      {/* Course Filter */}
      <div className="mb-6">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">{t("teacher.selectCourse")}</option>
          {assignments.map((a) => (
            <option key={a.course_id} value={a.course_id}>
              {getCourseName(a.course_id)}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-500">{t("loading")}</p>}

      {!loading && filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🎬</p>
          <p className="text-gray-500 dark:text-gray-400">{t("videos.noVideos")}</p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredVideos.map((video) => {
          const youtubeId = video.external_url
            ? extractYouTubeId(video.external_url)
            : null;

          return (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition"
            >
              {/* Video Preview */}
              <div className="aspect-video bg-gray-900 relative">
                {youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={video.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{video.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{video.description || t("homework.noText")}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {getCourseName(video.course_id)}
                  </span>
                  {isTeacher && (
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition"
                    >
                      {t("delete")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideosPage;
