import apiClient from "./client";

export const usersApi = {
  getAll: () => apiClient.get("/users"),
  getById: (id: string) => apiClient.get(`/users/${id}`),
  create: (data: any) => apiClient.post("/users", data),
  update: (id: string, data: any) => apiClient.patch(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

export const subjectsApi = {
  getAll: () => apiClient.get("/subjects"),
  getById: (id: string) => apiClient.get(`/subjects/${id}`),
  create: (data: any) => apiClient.post("/subjects", data),
  delete: (id: string) => apiClient.delete(`/subjects/${id}`),
};

export const topicsApi = {
  getBySubject: (subjectId: string) =>
    apiClient.get(`/topics/by-subject/${subjectId}`),
  getTree: (subjectId: string) => apiClient.get(`/topics/tree/${subjectId}`),
  getById: (id: string) => apiClient.get(`/topics/${id}`),
  create: (data: any) => apiClient.post("/topics", data),
  delete: (id: string) => apiClient.delete(`/topics/${id}`),
};

export const flashcardsApi = {
  getByTopic: (topicId: string) =>
    apiClient.get(`/flashcards/by-topic/${topicId}`),
  getDue: (userId: string, limit = 20) =>
    apiClient.get(`/flashcards/due/${userId}?limit=${limit}`),
  getById: (id: string) => apiClient.get(`/flashcards/${id}`),
  create: (data: any) => apiClient.post("/flashcards", data),
  delete: (id: string) => apiClient.delete(`/flashcards/${id}`),
};

export const reviewsApi = {
  submit: (data: any, quality: number) =>
    apiClient.post(`/reviews?quality=${quality}`, data),
  getHistory: (userId: string, limit = 50) =>
    apiClient.get(`/reviews/history/${userId}?limit=${limit}`),
  getSm2State: (userId: string, flashcardId: string) =>
    apiClient.get(`/reviews/sm2/${userId}/${flashcardId}`),
};
