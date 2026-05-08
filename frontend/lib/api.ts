import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export default api;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Observation {
  id: string;
  teacher_id: string;
  observed_at: string;
  scores: Record<string, number>;
  raw_notes: string;
  ai_summary: string;
  flagged: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  teacher_id: string;
  period: string;
  category_scores: Record<string, number>;
  final_notes: string;
  status: string;
  ai_summary: string;
  created_at: string;
}

export interface Note {
  id: string;
  teacher_id: string;
  content: string;
  tag: string;
  created_at: string;
}

export interface Goal {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  target_date: string;
  status: string;
  created_at: string;
  updates: GoalUpdate[];
}

export interface GoalUpdate {
  id: string;
  goal_id: string;
  content: string;
  created_at: string;
}

export interface DashboardData {
  observations_this_month: number;
  pending_reviews: number;
  open_goals: number;
  flagged_staff: Teacher[];
  recent_observations: (Observation & { teacher_name: string })[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const getDashboard = () => api.get<DashboardData>("/dashboard");
export const getStaff = () => api.get<Teacher[]>("/staff");
export const getStaffById = (id: string) => api.get(`/staff/${id}`);
export const getStaffSummary = (id: string) => api.get<{ summary: string }>(`/staff/${id}/summary`);

export const createObservation = (data: object) => api.post("/observations", data);
export const createReview = (data: object) => api.post("/reviews", data);
export const submitReview = (id: string) => api.patch(`/reviews/${id}/submit`);
export const acknowledgeReview = (id: string) => api.patch(`/reviews/${id}/acknowledge`);
export const getReviewSuggestions = (teacherId: string) =>
  api.get<{ suggestions: string[] }>(`/reviews/suggestions?teacher_id=${teacherId}`);

export const createNote = (data: object) => api.post("/notes", data);
export const createGoal = (data: object) => api.post("/goals", data);
export const updateGoal = (id: string, data: object) => api.patch(`/goals/${id}`, data);