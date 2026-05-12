import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "api/client";

interface Subject {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface SubjectsState {
  items: Subject[];
  loading: boolean;
  error: string | null;
}

const initialState: SubjectsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchSubjects = createAsyncThunk("subjects/fetchAll", async () => {
  const res = await apiClient.get("/subjects");
  return res.data as Subject[];
});

export const createSubject = createAsyncThunk(
  "subjects/create",
  async (data: { name: string; description?: string }) => {
    const res = await apiClient.post("/subjects", data);
    return res.data as Subject;
  },
);

const subjectsSlice = createSlice({
  name: "subjects",
  initialState,
  reducers: {},
  extraReducers: (b) =>
    b
      .addCase(fetchSubjects.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchSubjects.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchSubjects.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? "Failed to load subjects";
      })
      .addCase(createSubject.fulfilled, (s, a) => {
        s.items.push(a.payload);
      }),
});

export default subjectsSlice.reducer;
