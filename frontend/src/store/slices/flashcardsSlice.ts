import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "api/client";

interface Flashcard {
  id: string;
  topic_id: string;
  question: string;
  answer: string;
  explanation_prompt: string | null;
  created_at: string;
}

interface ReviewResult {
  flashcard_id: string;
  is_correct: boolean;
}

interface FlashcardsState {
  items: Flashcard[];
  currentIndex: number;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  results: ReviewResult[];
}

const initialState: FlashcardsState = {
  items: [],
  currentIndex: 0,
  loading: false,
  submitting: false,
  error: null,
  results: [],
};

export const fetchFlashcardsByTopic = createAsyncThunk(
  "flashcards/fetchByTopic",
  async (topicId: string) => {
    const res = await apiClient.get(`/flashcards/by-topic/${topicId}`);
    return res.data as Flashcard[];
  },
);

export const submitReview = createAsyncThunk(
  "flashcards/submitReview",
  async ({
    user_id,
    flashcard_id,
    is_correct,
    time_spent,
    confidence,
  }: {
    user_id: string;
    flashcard_id: string;
    is_correct: boolean;
    time_spent?: number;
    confidence?: number;
  }) => {
    const res = await apiClient.post("/reviews", {
      user_id,
      flashcard_id,
      is_correct,
      time_spent,
      confidence,
    });
    return { flashcard_id, is_correct } as ReviewResult;
  },
);

const flashcardsSlice = createSlice({
  name: "flashcards",
  initialState,
  reducers: {
    nextCard(s) {
      if (s.currentIndex < s.items.length - 1) {
        s.currentIndex += 1;
      }
    },
    resetReview(s) {
      s.currentIndex = 0;
      s.results = [];
      s.items = [];
      s.error = null;
    },
  },
  extraReducers: (b) =>
    b
      .addCase(fetchFlashcardsByTopic.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.currentIndex = 0;
        s.results = [];
      })
      .addCase(fetchFlashcardsByTopic.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchFlashcardsByTopic.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? "Failed to load flashcards";
      })
      .addCase(submitReview.pending, (s) => {
        s.submitting = true;
      })
      .addCase(submitReview.fulfilled, (s, a) => {
        s.submitting = false;
        s.results.push(a.payload);
      })
      .addCase(submitReview.rejected, (s, a) => {
        s.submitting = false;
        s.error = a.error.message ?? "Failed to submit review";
      }),
});

export const { nextCard, resetReview } = flashcardsSlice.actions;
export default flashcardsSlice.reducer;
