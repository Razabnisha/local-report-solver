/** Edit an existing report — owners and admins only. */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { ReportForm } from "@/components/reports/report-form";
import { EmptyState } from "@/components/reports/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchReport } from "@/lib/reports";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/reports/$reportId/edit")({
  head: () => ({
    meta: [
      { title: "Edit report — Local Report Hub" },
      { name: "description", content: "Update the details, photo or location of your civic report." },
      { property: "og:title", content: "Edit report — Local Report Hub" },
      { property: "og:description", content: "Update the details of your civic report." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EditReport,
});

function EditReport() {
  const { reportId } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const { data: report, isLoading } = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => fetchReport(reportId),
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Edit report</h1>
        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-xl" />
        ) : !report ? (
          <EmptyState title="Report not found" description="It may have already been deleted." />
        ) : user?.id !== report.user_id && !isAdmin ? (
          <EmptyState
            title="You can't edit this report"
            description="Only the person who submitted a report, or an administrator, can change it."
            action={
              <Button asChild>
                <Link to="/reports/$reportId" params={{ reportId }}>
                  View the report
                </Link>
              </Button>
            }
          />
        ) : (
          <ReportForm report={report} />
        )}
      </div>
    </PageShell>
  );
}
