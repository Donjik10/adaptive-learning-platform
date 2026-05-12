import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "api/client";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { fetchSubjects, createSubject } from "store/slices/subjectsSlice";
import { fetchTopicTree, clearTopics } from "store/slices/topicsSlice";
import UserSelector from "components/UserSelector";

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: subjects, loading: subjectsLoading } = useAppSelector(
    (s) => s.subjects,
  );
  const { tree: topicTree, loading: treeLoading } = useAppSelector(
    (s) => s.topics,
  );
  const currentUserId = useAppSelector((s) => s.users.currentId);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [showFcForm, setShowFcForm] = useState<string | null>(null);
  const [newFcQuestion, setNewFcQuestion] = useState("");
  const [newFcAnswer, setNewFcAnswer] = useState("");
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ total: 0, reviewed: 0, correct: 0, pct: 0 });

  useEffect(() => {
    dispatch(fetchSubjects());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSubjectId) {
      dispatch(fetchTopicTree(selectedSubjectId));
    } else {
      dispatch(clearTopics());
    }
  }, [selectedSubjectId, dispatch]);

  useEffect(() => {
    if (!currentUserId) return;
    apiClient.get(`/flashcards/due/${currentUserId}?limit=100`).then((r) => {
      const cards: any[] = r.data;
      const counts: Record<string, number> = {};
      cards.forEach((c: any) => {
        counts[c.topic_id] = (counts[c.topic_id] || 0) + 1;
      });
      setDueCounts(counts);
    }).catch(() => {});
  }, [currentUserId, selectedSubjectId]);

  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      try {
        const res = await apiClient.get(`/reviews/history/${currentUserId}?limit=1000`);
        const history: any[] = res.data;
        const today = new Date().toISOString().slice(0, 10);
        const todayReviews = history.filter((r) => r.reviewed_at?.startsWith(today));
        const correct = todayReviews.filter((r) => r.is_correct).length;
        setStats({
          total: todayReviews.length,
          reviewed: todayReviews.length,
          correct,
          pct: todayReviews.length ? Math.round((correct / todayReviews.length) * 100) : 0,
        });
      } catch {}
    })();
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

  const allTopicIds = (nodes: any[]): string[] => {
    const ids: string[] = [];
    for (const n of nodes) {
      ids.push(n.id);
      ids.push(...allTopicIds(n.children || []));
    }
    return ids;
  };

  if (!currentUserId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold text-gray-900">Adaptiv</h1>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            Adaptive learning with spaced repetition. Pick or create a user to start.
          </p>
        </div>
        <UserSelector />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserSelector />

      {stats.total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{stats.total}</p>
            <p className="text-xs text-gray-500">Reviewed today</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.correct}</p>
            <p className="text-xs text-gray-500">Correct today</p>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pct}%</p>
            <p className="text-xs text-gray-500">Success rate</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Subjects</h2>
        <button
          onClick={() => setShowSubjectForm(!showSubjectForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showSubjectForm ? "Cancel" : "+ Subject"}
        </button>
      </div>

      {showSubjectForm && (
        <form onSubmit={handleCreateSubject} className="flex gap-3">
          <input
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            placeholder="Subject name (e.g. Mathematics)"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Create
          </button>
        </form>
      )}

      {subjectsLoading ? (
        <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
      ) : subjects.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
          <p className="text-gray-400">No subjects yet.</p>
          <p className="text-xs text-gray-300 mt-1">Click "+ Subject" to create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const isSelected = selectedSubjectId === s.id;
            return (
              <div
                key={s.id}
                className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => setSelectedSubjectId(isSelected ? null : s.id)}
              >
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                {s.description && <p className="mt-0.5 text-xs text-gray-400">{s.description}</p>}
              </div>
            );
          })}
        </div>
      )}

      {selectedSubjectId && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Topics
              {topicTree.length > 0 && (
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  {allTopicIds(topicTree).filter((id) => (dueCounts[id] ?? 0) > 0).length} due
                </span>
              )}
            </h3>
            <button
              onClick={() => setShowTopicForm(!showTopicForm)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              + Topic
            </button>
          </div>

          {showTopicForm && (
            <form onSubmit={handleCreateTopic} className="flex gap-3 mb-4">
              <input
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="Topic name"
              />
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Create
              </button>
            </form>
          )}

          {treeLoading ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
          ) : topicTree.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              No topics. Add one to start building flashcards.
            </div>
          ) : (
            <div className="space-y-0.5">
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
  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
        style={{ paddingLeft: 12 + depth * 20 }}
      >
        <span className="text-xs text-gray-300">
          {topic.children?.length > 0 ? "⊞" : "◦"}
        </span>
        <span
          onClick={() => onStartReview(topic.id, topic.name)}
          className="flex-1 cursor-pointer text-sm font-medium text-gray-800 hover:text-indigo-600"
        >
          {topic.name}
        </span>
        {dueCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {dueCount} due
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFcForm(topic.id); }}
          className="opacity-0 group-hover:opacity-100 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
        >
          + Card
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onStartReview(topic.id, topic.name); }}
          className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          Review
        </button>
      </div>

      {showFcForm === topic.id && (
        <div className="flex gap-2 mb-2" style={{ paddingLeft: 12 + (depth + 1) * 20 }}>
          <input value={newFcQuestion} onChange={(e) => onFcQuestionChange(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none" placeholder="Question" />
          <input value={newFcAnswer} onChange={(e) => onFcAnswerChange(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-indigo-500 focus:outline-none" placeholder="Answer" />
          <button onClick={() => onCreateFlashcard(topic.id)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">Add</button>
        </div>
      )}

      {topic.children?.map((child: any) => (
        <TopicCard key={child.id} topic={child} depth={depth + 1} dueCount={0}
          onStartReview={onStartReview} showFcForm={showFcForm} onToggleFcForm={onToggleFcForm}
          newFcQuestion={newFcQuestion} newFcAnswer={newFcAnswer}
          onFcQuestionChange={onFcQuestionChange} onFcAnswerChange={onFcAnswerChange}
          onCreateFlashcard={onCreateFlashcard}
        />
      ))}
    </div>
  );
};

export default Dashboard;
