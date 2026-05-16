import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/LanguageContext";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  fetchFlashcardsByTopic,
  nextCard,
  resetReview,
  submitReview,
} from "store/slices/flashcardsSlice";

const ReviewPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const topicName = (location.state as any)?.topicName ?? t("review.title");

  const { items, currentIndex, loading, submitting, error, results } =
    useAppSelector((s) => s.flashcards);
  const userId = user?.id;

  const [flipped, setFlipped] = useState(false);
  const cardStart = useRef(Date.now());

  useEffect(() => {
    if (topicId) {
      dispatch(resetReview());
      dispatch(fetchFlashcardsByTopic(topicId));
    }
    return () => { dispatch(resetReview()); };
  }, [topicId, dispatch]);

  useEffect(() => {
    cardStart.current = Date.now();
    setFlipped(false);
  }, [currentIndex]);

  const current = items[currentIndex];
  const totalCards = items.length;
  const reviewedCount = results.length;
  const isDone = reviewedCount > 0 && currentIndex >= totalCards;

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (!userId || !current) return;
    const timeSpent = (Date.now() - cardStart.current) / 1000;
    dispatch(
      submitReview({
        user_id: userId,
        flashcard_id: current.id,
        is_correct: isCorrect,
        time_spent: timeSpent,
        confidence: isCorrect ? 4 : 2,
      }),
    ).then(() => dispatch(nextCard()));
  }, [userId, current, dispatch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      if (e.key === "1") handleAnswer(false);
      if (e.key === "2") handleAnswer(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleAnswer, flipped]);

  if (!userId) {
    return (
      <div className="mx-auto max-w-md mt-20 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t("loginToContinue")}</p>
        <button onClick={() => navigate("/")} className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          {t("nav.dashboard")}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400 dark:text-gray-500 animate-pulse">{t("loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md mt-20 text-center space-y-4">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <button onClick={() => navigate("/")} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          {t("nav.dashboard")}
        </button>
      </div>
    );
  }

  if (totalCards === 0) {
    return (
      <div className="mx-auto max-w-md mt-20 text-center space-y-4">
        <p className="text-gray-500 dark:text-gray-400">{t("dashboard.noTopics")}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{t("dashboard.addTopicHint")}</p>
        <button onClick={() => navigate("/")} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
          {t("nav.dashboard")}
        </button>
      </div>
    );
  }

  if (isDone) {
    const correct = results.filter((r) => r.is_correct).length;
    const pct = Math.round((correct / results.length) * 100);
    return (
      <div className="mx-auto max-w-md mt-16 text-center space-y-6">
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
          <div className="text-5xl mb-2">{pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪"}</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{topicName} — {t("review.completed")}</h2>
          <p className="mt-4 text-5xl font-bold text-indigo-600 dark:text-indigo-400">
            {correct}<span className="text-2xl text-gray-400 dark:text-gray-500">/{results.length}</span>
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{pct}% {t("review.accuracy")}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { dispatch(resetReview()); if (topicId) dispatch(fetchFlashcardsByTopic(topicId)); }}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            {t("review.title")} {t("review.again")}
          </button>
          <button onClick={() => navigate("/")}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            {t("nav.dashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/")} className="text-sm text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400">
          &larr; {t("nav.dashboard")}
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">{topicName}</span>
        <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
          {reviewedCount + 1} / {totalCards}
        </span>
      </div>

      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${(reviewedCount / totalCards) * 100}%` }}
        />
      </div>

      <div onClick={() => setFlipped(!flipped)}
        className="min-h-[280px] cursor-pointer rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm
          hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all flex flex-col items-center justify-center text-center select-none"
      >
        {flipped ? (
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{t("dashboard.answer")}</span>
            <p className="text-lg text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{current?.answer}</p>
            <p className="text-xs text-gray-300 dark:text-gray-500">{t("review.showAnswer")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <span className="inline-block rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400">{t("dashboard.question")}</span>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{current?.question}</p>
            <p className="text-xs text-gray-300 dark:text-gray-500">{t("review.showAnswer")}</p>
          </div>
        )}
      </div>

      {flipped && (
        <div className="flex gap-3">
          <button onClick={() => handleAnswer(false)} disabled={submitting}
            className="flex-1 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 py-3 text-sm font-bold text-red-700 dark:text-red-400
              hover:border-red-400 dark:hover:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-40 transition-all"
          >
            ✗ {t("review.incorrect")} <span className="text-xs font-normal text-red-400 dark:text-red-500">[1]</span>
          </button>
          <button onClick={() => handleAnswer(true)} disabled={submitting}
            className="flex-1 rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 py-3 text-sm font-bold text-green-700 dark:text-green-400
              hover:border-green-400 dark:hover:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-40 transition-all"
          >
            ✓ {t("review.correct")} <span className="text-xs font-normal text-green-400 dark:text-green-500">[2]</span>
          </button>
        </div>
      )}

      {!flipped && (
        <p className="text-center text-xs text-gray-300 dark:text-gray-500">{t("review.showAnswer")} <kbd className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-xs">Space</kbd></p>
      )}
    </div>
  );
};

export default ReviewPage;
