/**
 * Data access helpers for reports, comments and stats.
 * All queries run through the browser Supabase client, so Row Level Security
 * decides what each visitor is allowed to read or change.
 */
import { supabase } from "@/integrations/supabase/client";
import { PAGE_SIZE } from "./constants";
import type {
  CommunityVerification,
  CommentWithAuthor,
  ReportFilters,
  ReportWithAuthor,
  VerificationCounts,
  VerificationResponse,
} from "./types";

const REPORT_SELECT = "*, profiles:profiles!reports_profile_fkey(id, full_name, avatar)";
const COMMENT_SELECT = "*, profiles:profiles!comments_profile_fkey(id, full_name, avatar)";

export async function fetchReports(
  filters: Partial<ReportFilters> & { userId?: string; limit?: number },
) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? PAGE_SIZE;
  const from = (page - 1) * limit;

  let query = supabase
    .from("reports")
    .select(REPORT_SELECT, { count: "exact" })
    .order("created_at", { ascending: filters.sort === "oldest" })
    .range(from, from + limit - 1);

  if (filters.search) query = query.ilike("title", `%${filters.search}%`);
  if (filters.category && filters.category !== "all")
    query = query.eq("category", filters.category);
  if (filters.status && filters.status !== "all")
    query = query.eq("status", filters.status as never);
  if (filters.priority && filters.priority !== "all")
    query = query.eq("priority", filters.priority as never);
  if (filters.userId) query = query.eq("user_id", filters.userId);

  const { data, error, count } = await query;
  if (error) throw error;

  return { reports: (data ?? []) as unknown as ReportWithAuthor[], total: count ?? 0 };
}

export async function fetchReport(id: string) {
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as ReportWithAuthor) ?? null;
}

export async function fetchVerificationCounts(reportId: string, verificationRound: number) {
  const { data, error } = await supabase
    .from("report_verification_counts")
    .select("report_id, verification_round, solved_count, still_exists_count")
    .eq("report_id", reportId)
    .eq("verification_round", verificationRound)
    .maybeSingle();
  if (error) throw error;
  return (
    (data as VerificationCounts | null) ?? {
      report_id: reportId,
      verification_round: verificationRound,
      solved_count: 0,
      still_exists_count: 0,
    }
  );
}

export async function fetchMyVerification(
  reportId: string,
  userId: string,
  verificationRound: number,
) {
  const { data, error } = await supabase
    .from("community_verifications")
    .select("*")
    .eq("report_id", reportId)
    .eq("user_id", userId)
    .eq("verification_round", verificationRound)
    .maybeSingle();
  if (error) throw error;
  return (data as CommunityVerification | null) ?? null;
}

export async function submitVerification(
  reportId: string,
  userId: string,
  response: VerificationResponse,
) {
  const { data, error } = await supabase
    .from("community_verifications")
    .insert({ report_id: reportId, user_id: userId, response })
    .select("*")
    .single();
  if (error) throw error;
  return data as CommunityVerification;
}

export async function fetchComments(reportId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select(COMMENT_SELECT)
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as CommentWithAuthor[];
}

/** Aggregated counts used by the home page and dashboards. */
export async function fetchStats(userId?: string) {
  const base = () => {
    const q = supabase.from("reports").select("id", { count: "exact", head: true });
    return userId ? q.eq("user_id", userId) : q;
  };

  const [total, pending, inProgress, resolved] = await Promise.all([
    base(),
    base().eq("status", "pending"),
    base().eq("status", "in_progress"),
    base().eq("status", "resolved"),
  ]);

  return {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    inProgress: inProgress.count ?? 0,
    resolved: resolved.count ?? 0,
  };
}

/** Category breakdown for the admin analytics charts. */
export async function fetchCategoryBreakdown() {
  const { data, error } = await supabase.from("reports").select("category, status, created_at");
  if (error) throw error;
  return data ?? [];
}

/** Uploads an image into the signed-in user's own storage folder. */
export async function uploadReportImage(file: File, userId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("report-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Report photos live in a private bucket, so we resolve a signed URL on demand. */
export async function getImageUrl(path: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage
    .from("report-images")
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data?.signedUrl ?? null;
}
