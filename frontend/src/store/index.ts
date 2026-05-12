import { configureStore } from "@reduxjs/toolkit";
import subjectsReducer from "./slices/subjectsSlice";
import topicsReducer from "./slices/topicsSlice";
import flashcardsReducer from "./slices/flashcardsSlice";
import usersReducer from "./slices/usersSlice";

export const store = configureStore({
  reducer: {
    subjects: subjectsReducer,
    topics: topicsReducer,
    flashcards: flashcardsReducer,
    users: usersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
