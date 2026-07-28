/** Full detail view for a single report, including comments. */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MapPin, Pencil, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/page-shell";
import { PriorityBadge, StatusBadge } from "@/components/reports/badges";
import { CommentSection } from "@/components/reports/comment-section";
import { ReportImage } from "@/components/reports/report-image";
import { EmptyState } from "@/components/reports/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryIcon, categoryLabel } from "@/lib/constants";
import { fetchReport } from "@/lib/reports";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/reports/$reportId")({
  head: () => ({
    meta: [
      { title: "Report details — Local Report Hub" },
      {
        name: "description",
        content: "See the full description, photo, location, status and community comments for this civic report.",
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

  return (
    <PageShell>
      <article className="mx-auto max-w-4xl px-4 py-12">
        <div className="surface-card overflow-hidden">
          <ReportImage path={report.image_url} alt={report.title} className="h-80 w-full object-cover" />

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
