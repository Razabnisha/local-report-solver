/** Full detail view for a single report, including comments. */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { PriorityBadge, StatusBadge } from "@/components/reports/badges";
import { CommentSection } from "@/components/reports/comment-section";
import { ReportImage } from "@/components/reports/report-image";
import { EmptyState } from "@/components/reports/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryIcon, categoryLabel } from "@/lib/constants";
import {
  fetchMyVerification,
  fetchReport,
  fetchVerificationCounts,
  submitVerification,
} from "@/lib/reports";
import type { VerificationResponse } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/reports/$reportId")({
  head: () => ({
    meta: [
      { title: "Report details — Local Report Hub" },
      {
        name: "description",
        content:
          "See the full description, photo, location, status and community comments for this civic report.",
      },
      { property: "og:title", content: "Report details — Local Report Hub" },
      {
        property: "og:description",
        content: "Full description, photo, location, status and comments for this civic report.",
      },
    ],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { reportId } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => fetchReport(reportId),
  });

  const { data: verificationCounts } = useQuery({
    queryKey: ["verification-counts", reportId, report?.verification_round],
    queryFn: () => fetchVerificationCounts(reportId, report!.verification_round),
    enabled: Boolean(report),
  });

  const { data: myVerification } = useQuery({
    queryKey: ["my-verification", reportId, user?.id, report?.verification_round],
    queryFn: () => fetchMyVerification(reportId, user!.id, report!.verification_round),
    enabled: Boolean(user && report),
  });

  const verify = useMutation({
    mutationFn: (response: VerificationResponse) => {
      if (!user) throw new Error("You must be signed in to verify a report.");
      return submitVerification(reportId, user.id, response);
    },
    onSuccess: (_, response) => {
      toast.success(
        response === "solved"
          ? "Thanks — you confirmed this problem is solved."
          : "Thanks — the report has been reopened for follow-up.",
      );
      void queryClient.invalidateQueries({ queryKey: ["report", reportId] });
      void queryClient.invalidateQueries({ queryKey: ["verification-counts", reportId] });
      void queryClient.invalidateQueries({ queryKey: ["my-verification", reportId] });
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reports").delete().eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report deleted");
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      navigate({ to: "/reports" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-12">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </PageShell>
    );
  }

  if (!report) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-20">
          <EmptyState
            title="Report not found"
            description="This report may have been removed by its author or an administrator."
            action={
              <Button asChild>
                <Link to="/reports">Browse reports</Link>
              </Button>
            }
          />
        </div>
      </PageShell>
    );
  }

  const Icon = categoryIcon(report.category);
  const canManage = user?.id === report.user_id || isAdmin;
  const hasVerificationWorkflow = [
    "awaiting_verification",
    "verified_resolved",
    "reopened",
  ].includes(report.status);

  return (
    <PageShell>
      <article className="mx-auto max-w-4xl px-4 py-12">
        <div className="surface-card overflow-hidden">
          <ReportImage
            path={report.image_url}
            alt={report.title}
            className="h-80 w-full object-cover"
          />

          <div className="space-y-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority} />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium">
                <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                {categoryLabel(report.category)}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight">{report.title}</h1>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" aria-hidden="true" />
                {report.profiles?.full_name ?? "Resident"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                {new Date(report.created_at).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {report.location || "Location not specified"}
              </span>
            </div>

            <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
              {report.description}
            </p>

            {hasVerificationWorkflow && (
              <section
                className="rounded-2xl border border-primary/20 bg-primary/5 p-5"
                aria-labelledby="community-verification-heading"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                    {report.status === "verified_resolved" ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <CircleAlert className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 id="community-verification-heading" className="font-semibold">
                      Community verification
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {report.status === "awaiting_verification"
                        ? "The work has been marked resolved. Let us know whether the problem is actually fixed."
                        : report.status === "verified_resolved"
                          ? "Residents confirmed that this problem has been resolved."
                          : "A resident reported that this problem still exists, so the report is open again."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <p className="text-2xl font-bold tabular-nums">
                      {verificationCounts?.solved_count ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      People who confirmed it is solved
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-4">
                    <p className="text-2xl font-bold tabular-nums">
                      {verificationCounts?.still_exists_count ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground">People who said it still exists</p>
                  </div>
                </div>

                {report.status === "awaiting_verification" && (
                  <div className="mt-5 border-t border-primary/15 pt-5">
                    {!user ? (
                      <p className="text-sm text-muted-foreground">
                        <Link to="/auth" className="font-medium text-primary hover:underline">
                          Sign in
                        </Link>{" "}
                        to verify whether this problem is fixed.
                      </p>
                    ) : myVerification ? (
                      <p className="text-sm font-medium text-foreground">
                        You already submitted your response for this verification round.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">What is the current situation?</p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            onClick={() => verify.mutate("solved")}
                            disabled={verify.isPending}
                            className="sm:flex-1"
                          >
                            {verify.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Problem Solved
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => verify.mutate("still_exists")}
                            disabled={verify.isPending}
                            className="sm:flex-1"
                          >
                            Problem Still Exists
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            )}

            {report.latitude != null && report.longitude != null && (
              <iframe
                title="Map of the reported location"
                className="h-64 w-full rounded-xl border border-border"
                loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${report.longitude - 0.004}%2C${report.latitude - 0.003}%2C${report.longitude + 0.004}%2C${report.latitude + 0.003}&layer=mapnik&marker=${report.latitude}%2C${report.longitude}`}
              />
            )}

            {canManage && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-5">
                <Button asChild variant="outline" size="sm">
                  <Link to="/reports/$reportId/edit" params={{ reportId }}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit report
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Delete this report permanently?")) remove.mutate();
                  }}
                  disabled={remove.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <CommentSection reportId={reportId} />
        </div>
      </article>
    </PageShell>
  );
}
