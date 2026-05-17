import apiClient from "./client";

export interface Video {
  id: string;
  teacher_id: string;
  course_id: string;
  title: string;
  description?: string;
  source_type: "upload" | "external_link";
  file_url?: string;
  external_url?: string;
  created_at: string;
}

export const listVideos = (courseId?: string) =>
  apiClient.get<Video[]>("/videos", { params: { course_id: courseId } });

export const getVideo = (id: string) =>
  apiClient.get<Video>(`/videos/${id}`);

export const createVideo = (data: {
  course_id: string;
  title: string;
  description?: string;
  source_type: string;
  external_url?: string;
}) => apiClient.post<Video>("/videos", data);

export const deleteVideo = (id: string) =>
  apiClient.delete(`/videos/${id}`);
