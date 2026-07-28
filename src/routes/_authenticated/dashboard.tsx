/** Personal dashboard: stats + manage your own reports. */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, Clock, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell, StatCard } from "@/components/layout/page-shell";
import { PriorityBadge, StatusBadge } from "@/components/reports/badges";
import { EmptyState } from "@/components/reports/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryLabel } from "@/lib/constants";
import { fetchReports, fetchStats } from "@/lib/reports";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My dashboard — Local Report Hub" },
      { name: "description", content: "Track the status of every civic report you have submitted." },
      { property: "og:title", content: "My dashboard — Local Report Hub" },
      { property: "og:description", content: "Track the status of every report you have submitted." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["stats", "user", user?.id],
    queryFn: () => fetchStats(user!.id),
    enabled: Boolean(user),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "mine", user?.id],
    queryFn: () => fetchReports({ userId: user!.id, limit: 100 }),
    enabled: Boolean(user),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report deleted");
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Hi {profile?.full_name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="mt-2 text-muted-foreground">Here's how your reports are progressing.</p>
          </div>
          <Button asChild>
            <Link to="/reports/new">
              <Plus className="mr-1 h-4 w-4" /> New report
            </Link>
          </Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total reports" value={stats?.total ?? 0} icon={<ClipboardList className="h-5 w-5" />} />
          <StatCard label="Pending" value={stats?.pending ?? 0} tone="warning" icon={<Clock className="h-5 w-5" />} />
          <StatCard
            label="In progress"
            value={stats?.inProgress ?? 0}
            tone="info"
            icon={<Loader2 className="h-5 w-5" />}
          />
          <StatCard
            label="Resolved"
            value={stats?.resolved ?? 0}
            tone="success"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>

        <h2 className="mb-4 mt-12 text-xl font-semibold">Report history</h2>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : data && data.reports.length > 0 ? (
          <div className="surface-card divide-y divide-border overflow-hidden">
            {data.reports.map((report) => (
              <div key={report.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    to="/reports/$reportId"
                    params={{ reportId: report.id }}
                    className="line-clamp-1 font-medium hover:text-primary"
                  >
                    {report.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {categoryLabel(report.category)} · {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={report.status} />
                <PriorityBadge priority={report.priority} />
                <div className="flex gap-1">
                  <Button asChild variant="ghost" size="icon" aria-label="Edit report">
                    <Link to="/reports/$reportId/edit" params={{ reportId: report.id }}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete report"
                    onClick={() => {
                      if (window.confirm("Delete this report permanently?")) remove.mutate(report.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="You haven't reported anything yet"
            description="Spotted a pothole, a broken light or an overflowing bin? Log it and track the fix."
            action={
              <Button asChild>
                <Link to="/reports/new">Create your first report</Link>
              </Button>
            }
          />
        )}
      </div>
    </PageShell>
  );
}
