import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "api/client";

export interface TopicTree {
  id: string;
  subject_id: string;
  parent_topic_id: string | null;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
  children: TopicTree[];
}

interface TopicsState {
  tree: TopicTree[];
  loading: boolean;
  error: string | null;
}

const initialState: TopicsState = {
  tree: [],
  loading: false,
  error: null,
};

export const fetchTopicTree = createAsyncThunk(
  "topics/fetchTree",
  async (subjectId: string) => {
    const res = await apiClient.get(`/topics/tree/${subjectId}`);
    return res.data as TopicTree[];
  },
);

const topicsSlice = createSlice({
  name: "topics",
  initialState,
  reducers: {
    clearTopics(s) {
      s.tree = [];
    },
  },
  extraReducers: (b) =>
    b
      .addCase(fetchTopicTree.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchTopicTree.fulfilled, (s, a) => {
        s.loading = false;
        s.tree = a.payload;
      })
      .addCase(fetchTopicTree.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? "Failed to load topics";
      }),
});

export const { clearTopics } = topicsSlice.actions;
export default topicsSlice.reducer;
