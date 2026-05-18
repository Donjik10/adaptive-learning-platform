import apiClient from "./client";

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  course_id: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content_text?: string;
  file_url?: string;
  status: "pending" | "reviewed" | "ai_reviewed";
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id?: string;
  sender_type: "student" | "teacher" | "ai_tutor";
  message_text: string;
  created_at: string;
}

export const listAssignments = (courseId?: string) =>
  apiClient.get<Assignment[]>("/homework/assignments", { params: { course_id: courseId } });

export const getAssignment = (id: string) =>
  apiClient.get<Assignment>(`/homework/assignments/${id}`);

export const createSubmission = (data: { assignment_id: string; content_text?: string; file_url?: string }) =>
  apiClient.post<Submission>("/homework/submissions", data);

export const listSubmissions = (assignmentId?: string) =>
  apiClient.get<Submission[]>("/homework/submissions", { params: { assignment_id: assignmentId } });

export const getSubmission = (id: string) =>
  apiClient.get<Submission>(`/homework/submissions/${id}`);

export const getChatMessages = (submissionId: string) =>
  apiClient.get<ChatMessage[]>(`/homework/submissions/${submissionId}/chat`);

export const postChatMessage = (submissionId: string, message_text: string) =>
  apiClient.post<ChatMessage>(`/homework/submissions/${submissionId}/chat`, { message_text });

export const requestAIReview = (submissionId: string) =>
  apiClient.post<ChatMessage>(`/homework/submissions/${submissionId}/chat/ai-review`);

export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<{ filename: string; url: string }>("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
