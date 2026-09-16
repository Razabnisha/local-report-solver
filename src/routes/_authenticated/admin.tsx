/** Admin console: moderate every report and update statuses. */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardList, Clock, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell, StatCard } from "@/components/layout/page-shell";
import { PriorityBadge } from "@/components/reports/badges";
import { FilterBar, PaginationBar, type FilterValues } from "@/components/reports/filter-bar";
import { EmptyState } from "@/components/reports/states";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ADMIN_STATUSES,
  CATEGORIES,
  PAGE_SIZE,
  categoryLabel,
  statusAfterAdminSelection,
  type ReportStatus,
} from "@/lib/constants";
import { fetchCategoryBreakdown, fetchReports, fetchStats } from "@/lib/reports";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — Local Report Hub" },
      { name: "description", content: "Moderate community reports and keep statuses up to date." },
      { property: "og:title", content: "Admin console — Local Report Hub" },
      { property: "og:description", content: "Moderate community reports and update statuses." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminConsole,
});

const EMPTY: FilterValues = {
  search: "",
  category: "all",
  status: "all",
  priority: "all",
  sort: "newest",
};

function AdminConsole() {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterValues>(EMPTY);
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery({
    queryKey: ["stats", "all"],
    queryFn: () => fetchStats(),
    enabled: isAdmin,
  });
  const { data: breakdown } = useQuery({
    queryKey: ["category-breakdown"],
    queryFn: fetchCategoryBreakdown,
    enabled: isAdmin,
  });
  const { data, isLoading } = useQuery({
    queryKey: ["reports", "admin", filters, page],
    queryFn: () => fetchReports({ ...filters, page }),
    enabled: isAdmin,
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      const nextStatus = statusAfterAdminSelection(status);
      const { error } = await supabase.from("reports").update({ status: nextStatus }).eq("id", id);
      if (error) throw error;
      return nextStatus;
    },
    onSuccess: (status) => {
      toast.success(
        status === "awaiting_verification"
          ? "Report marked resolved and sent for community verification"
          : "Status updated",
      );
      void queryClient.invalidateQueries({ queryKey: ["reports"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (error: Error) => toast.error(error.message),
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

  if (loading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-20">
          <EmptyState
            title="Administrators only"
            description="Your account doesn't have permission to open the moderation console."
            action={
              <Button asChild>
                <Link to="/dashboard">Back to my dashboard</Link>
              </Button>
            }
          />
        </div>
      </PageShell>
    );
  }

  const counts = CATEGORIES.map((category) => ({
    ...category,
    count: (breakdown ?? []).filter((row) => row.category === category.value).length,
  })).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Admin console</h1>
          <p className="mt-2 text-muted-foreground">
            Triage incoming reports and keep residents informed.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="All reports"
            value={stats?.total ?? 0}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <StatCard
            label="Pending"
            value={stats?.pending ?? 0}
            tone="warning"
            icon={<Clock className="h-5 w-5" />}
          />
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

        <section className="surface-card mt-8 p-6">
          <h2 className="text-lg font-semibold">Reports by category</h2>
          <ul className="mt-4 space-y-3">
            {counts.map((category) => (
              <li key={category.value} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-sm">{category.label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(category.count / max) * 100}%` }}
                  />
                </span>
                <span className="w-8 text-right text-sm font-semibold tabular-nums">
                  {category.count}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <FilterBar
            values={filters}
            onChange={(next) => {
              setFilters((prev) => ({ ...prev, ...next }));
              setPage(1);
            }}
          />
        </div>

        <div className="mt-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : data && data.reports.length > 0 ? (
            <>
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
                        {categoryLabel(report.category)} ·{" "}
                        {report.profiles?.full_name ?? "Resident"} ·{" "}
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <PriorityBadge priority={report.priority} />
                    <Select
                      value={report.status}
                      onValueChange={(status) =>
                        setStatus.mutate({ id: report.id, status: status as ReportStatus })
                      }
                    >
                      <SelectTrigger className="w-40" aria-label="Update status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADMIN_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete report"
                      onClick={() => {
                        if (window.confirm("Delete this report permanently?"))
                          remove.mutate(report.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <PaginationBar
                page={page}
                total={data.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          ) : (
            <EmptyState
              title="No reports match these filters"
              description="Try widening your search."
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
