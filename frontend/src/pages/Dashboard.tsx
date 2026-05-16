import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "api/client";
import { useAuth } from "context/AuthContext";
import { useTranslation } from "context/LanguageContext";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { fetchSubjects, createSubject } from "store/slices/subjectsSlice";
import { fetchTopicTree, clearTopics } from "store/slices/topicsSlice";

const SUBJECT_GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-rose-600",
  "from-sky-500 to-blue-600",
  "from-pink-500 to-fuchsia-600",
  "from-amber-500 to-yellow-600",
];

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: subjects, loading: subjectsLoading } = useAppSelector((s) => s.subjects);
  const { tree: topicTree, loading: treeLoading } = useAppSelector((s) => s.topics);
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [showFcForm, setShowFcForm] = useState<string | null>(null);
  const [newFcQuestion, setNewFcQuestion] = useState("");
  const [newFcAnswer, setNewFcAnswer] = useState("");
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ total: 0, correct: 0, pct: 0 });

  useEffect(() => { dispatch(fetchSubjects()); }, [dispatch]);

  useEffect(() => {
    if (selectedSubjectId) { dispatch(fetchTopicTree(selectedSubjectId)); }
    else { dispatch(clearTopics()); }
  }, [selectedSubjectId, dispatch]);

  useEffect(() => {
    if (!currentUserId) return;
    apiClient.get(`/flashcards/due/${currentUserId}?limit=100`).then((r) => {
      const cards: any[] = r.data;
      const counts: Record<string, number> = {};
      cards.forEach((c: any) => { counts[c.topic_id] = (counts[c.topic_id] || 0) + 1; });
      setDueCounts(counts);
    }).catch(() => {});
  }, [currentUserId, selectedSubjectId]);

  useEffect(() => {
    if (!currentUserId) return;
    apiClient.get(`/reviews/history/${currentUserId}?limit=1000`).then((res) => {
      const history: any[] = res.data;
      const today = new Date().toISOString().slice(0, 10);
      const todayR = history.filter((r) => r.reviewed_at?.startsWith(today));
      const correct = todayR.filter((r) => r.is_correct).length;
      setStats({ total: todayR.length, correct, pct: todayR.length ? Math.round((correct / todayR.length) * 100) : 0 });
    }).catch(() => {});
  }, [currentUserId]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    await dispatch(createSubject({ name: newSubjectName }));
    setNewSubjectName("");
    setShowSubjectForm(false);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !selectedSubjectId) return;
    await apiClient.post("/topics", { subject_id: selectedSubjectId, name: newTopicName });
    setNewTopicName("");
    setShowTopicForm(false);
    dispatch(fetchTopicTree(selectedSubjectId));
  };

  const handleCreateFlashcard = async (topicId: string) => {
    if (!newFcQuestion.trim() || !newFcAnswer.trim()) return;
    await apiClient.post("/flashcards", { topic_id: topicId, question: newFcQuestion, answer: newFcAnswer });
    setNewFcQuestion("");
    setNewFcAnswer("");
    setShowFcForm(null);
  };

  const allDue = Object.values(dueCounts).reduce((a, b) => a + b, 0);

  if (!currentUserId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("app.name")}</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t("loginToContinue")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 text-white shadow-md">
          <p className="text-2xl font-bold">{subjects.length}</p>
          <p className="text-xs text-indigo-100 mt-0.5">{t("dashboard.subjects")}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white shadow-md">
          <p className="text-2xl font-bold">{allDue}</p>
          <p className="text-xs text-emerald-100 mt-0.5">{t("dashboard.dueNow")}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-md">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-amber-100 mt-0.5">{t("dashboard.reviewedToday")}</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-4 text-white shadow-md">
          <p className="text-2xl font-bold">{stats.pct}%</p>
          <p className="text-xs text-rose-100 mt-0.5">{t("dashboard.successRate")}</p>
        </div>
      </div>

      {/* Subjects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("nav.courses")}</h2>
          <button
            onClick={() => setShowSubjectForm(!showSubjectForm)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm transition-all"
          >
            {showSubjectForm ? t("cancel") : t("dashboard.addCourse")}
          </button>
        </div>

        {showSubjectForm && (
          <form onSubmit={handleCreateSubject} className="flex gap-3 mb-4">
            <input
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder={t("nav.courses")}
              autoFocus
            />
            <button type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all"
            >
              {t("create")}
            </button>
          </form>
        )}

        {subjectsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t("dashboard.noCourses")}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("dashboard.createCourseHint")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s, idx) => {
              const isSelected = selectedSubjectId === s.id;
              const gradient = SUBJECT_GRADIENTS[idx % SUBJECT_GRADIENTS.length];
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedSubjectId(isSelected ? null : s.id);
                    setSelectedSubjectName(s.name);
                  }}
                  className={`group relative rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 overflow-hidden
                    ${isSelected
                      ? "border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md"
                    }`}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 bg-gradient-to-br ${gradient}`} />
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold mb-3`}>
                      {s.name[0]}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</h3>
                    {s.description && (
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{s.description}</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute bottom-3 right-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                      {t("dashboard.selected")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Topics Panel */}
      {selectedSubjectId && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{selectedSubjectName}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {topicTree.length} {t("dashboard.topics")}
                  {allDue > 0 && ` · ${allDue} ${t("dashboard.cardsDue")}`}
                </p>
              </div>
              <button
                onClick={() => setShowTopicForm(!showTopicForm)}
                className="rounded-xl bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
              >
                {t("dashboard.addTopic")}
              </button>
            </div>
          </div>

          <div className="p-5">
            {showTopicForm && (
              <form onSubmit={handleCreateTopic} className="flex gap-3 mb-5">
                <input
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={t("nav.topics")}
                  autoFocus
                />
                <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
                  {t("create")}
                </button>
              </form>
            )}

            {treeLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
                ))}
              </div>
            ) : topicTree.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">{t("dashboard.noTopics")}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("dashboard.addTopicHint")}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {topicTree.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    depth={0}
                    dueCount={dueCounts[topic.id] ?? 0}
                    onStartReview={(id, name) => navigate(`/review/${id}`, { state: { topicName: name } })}
                    showFcForm={showFcForm}
                    onToggleFcForm={(id) => setShowFcForm(showFcForm === id ? null : id)}
                    newFcQuestion={newFcQuestion}
                    newFcAnswer={newFcAnswer}
                    onFcQuestionChange={setNewFcQuestion}
                    onFcAnswerChange={setNewFcAnswer}
                    onCreateFlashcard={handleCreateFlashcard}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TopicCard: React.FC<{
  topic: any; depth: number; dueCount: number;
  onStartReview: (id: string, name: string) => void;
  showFcForm: string | null; onToggleFcForm: (id: string) => void;
  newFcQuestion: string; newFcAnswer: string;
  onFcQuestionChange: (v: string) => void; onFcAnswerChange: (v: string) => void;
  onCreateFlashcard: (topicId: string) => void;
}> = ({ topic, depth, dueCount, onStartReview, showFcForm, onToggleFcForm, newFcQuestion, newFcAnswer, onFcQuestionChange, onFcAnswerChange, onCreateFlashcard }) => {
  const { t } = useTranslation();
  const hasChildren = topic.children?.length > 0;
  return (
    <div>
      <div
        className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all cursor-pointer
          ${depth === 0 ? "bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
        style={{ marginLeft: depth * 24 }}
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasChildren ? "bg-indigo-400" : "bg-gray-300 dark:bg-gray-500"}`} />
        <span
          onClick={() => onStartReview(topic.id, topic.name)}
          className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          {topic.name}
        </span>
        {dueCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            {dueCount} {t("dashboard.dueNow")}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFcForm(topic.id); }}
          className="opacity-0 group-hover:opacity-100 rounded-lg border border-gray-200 dark:border-gray-600 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
        >
          {t("dashboard.addCard")}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onStartReview(topic.id, topic.name); }}
          className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all"
        >
          {t("dashboard.review")} →
        </button>
      </div>

      {showFcForm === topic.id && (
        <div className="flex gap-2 mb-2" style={{ marginLeft: 12 + (depth + 1) * 24 }}>
          <input value={newFcQuestion} onChange={(e) => onFcQuestionChange(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder={t("dashboard.question")} autoFocus />
          <input value={newFcAnswer} onChange={(e) => onFcAnswerChange(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder={t("dashboard.answer")} />
          <button onClick={() => onCreateFlashcard(topic.id)}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">{t("create")}</button>
        </div>
      )}

      {topic.children?.map((child: any) => (
        <TopicCard
          key={child.id} topic={child} depth={depth + 1}
          dueCount={0}
          onStartReview={onStartReview}
          showFcForm={showFcForm} onToggleFcForm={onToggleFcForm}
          newFcQuestion={newFcQuestion} newFcAnswer={newFcAnswer}
          onFcQuestionChange={onFcQuestionChange} onFcAnswerChange={onFcAnswerChange}
          onCreateFlashcard={onCreateFlashcard}
        />
      ))}
    </div>
  );
};

export default Dashboard;
