import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import apiClient from "api/client";

interface User {
  id: string;
  name: string;
  email: string;
  learning_style: string | null;
  daily_study_limit: number | null;
}

interface UsersState {
  items: User[];
  currentId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  currentId: localStorage.getItem("adaptiv_user_id"),
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk("users/fetchAll", async () => {
  const res = await apiClient.get("/users");
  return res.data as User[];
});

export const createUser = createAsyncThunk(
  "users/create",
  async (data: { name: string; email: string; learning_style?: string }) => {
    const res = await apiClient.post("/users", data);
    return res.data as User;
  },
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setCurrentUser(s, a: { payload: string }) {
      s.currentId = a.payload;
      localStorage.setItem("adaptiv_user_id", a.payload);
    },
    logout(s) {
      s.currentId = null;
      localStorage.removeItem("adaptiv_user_id");
    },
  },
  extraReducers: (b) =>
    b
      .addCase(fetchUsers.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchUsers.fulfilled, (s, a) => {
        s.loading = false;
        s.items = a.payload;
      })
      .addCase(fetchUsers.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? "Failed to load users";
      })
      .addCase(createUser.fulfilled, (s, a) => {
        s.items.push(a.payload);
      }),
});

export const { setCurrentUser, logout } = usersSlice.actions;
export default usersSlice.reducer;
