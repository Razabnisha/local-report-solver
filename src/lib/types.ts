/** Shared TypeScript interfaces used across the app. */
import type { ReportPriority, ReportStatus } from "./constants";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: ReportPriority;
  status: ReportStatus;
  image_url: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  verification_round: number;
}

export interface ReportWithAuthor extends Report {
  profiles: Pick<Profile, "id" | "full_name" | "avatar"> | null;
}

export interface CommentWithAuthor {
  id: string;
  report_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles: Pick<Profile, "id" | "full_name" | "avatar"> | null;
}

export interface VerificationCounts {
  report_id: string;
  verification_round: number;
  solved_count: number;
  still_exists_count: number;
}

export type VerificationResponse = "solved" | "still_exists";

export interface CommunityVerification {
  id: string;
  report_id: string;
  user_id: string;
  response: VerificationResponse;
  verification_round: number;
  created_at: string;
}

export interface ReportFilters {
  search: string;
  category: string;
  status: string;
  priority: string;
  sort: "newest" | "oldest";
  page: number;
}
