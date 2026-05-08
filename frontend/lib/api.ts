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
  observation_type: string;
  framework: string;
  course_name: string;
  room: string;
  scores: Record<string, number>;
  section_notes: Record<string, string>;
  raw_notes: string;
  ai_summary: string;
  flagged: boolean;
  status: string;
  created_at: string;
}

export interface Review {
  id: string;
  teacher_id: string;
  period: string;
  category_scores: Record<string, number>;
  final_notes: string;
  teacher_response: string;
  status: string;
  ai_summary: string;
  created_at: string;
}

export interface Note {
  id: string;
  teacher_id: string;
  content: string;
  tag: string;
  pinned: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  teacher_id: string;
  title: string;
  description: string;
  linked_dimension: string;
  evidence_type: string;
  target_date: string;
  status: string;
  created_at: string;
  milestones: Milestone[];
  updates: GoalUpdate[];
}

export interface Milestone {
  id: string;
  goal_id: string;
  description: string;
  due_date: string;
  completed: boolean;
}

export interface GoalUpdate {
  id: string;
  goal_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface DashboardData {
  observations_this_month: number;
  pending_reviews: number;
  open_goals: number;
  at_risk_goals: number;
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
export const getReviewSuggestions = (teacherId: string) =>
  api.get<{ suggestions: string[] }>(`/reviews/suggestions?teacher_id=${teacherId}`);

export const createNote = (data: object) => api.post("/notes", data);
export const createGoal = (data: object) => api.post("/goals", data);
export const updateGoal = (id: string, data: object) => api.patch(`/goals/${id}`, data);