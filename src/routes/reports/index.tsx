/** Public browse page with search, filters, sorting and pagination. */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/page-shell";
import { FilterBar, PaginationBar } from "@/components/reports/filter-bar";
import { ReportCard } from "@/components/reports/report-card";
import { EmptyState, ReportGridSkeleton } from "@/components/reports/states";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE } from "@/lib/constants";
import { fetchReports } from "@/lib/reports";

interface ReportSearch {
  search?: string;
  category?: string;
  status?: string;
  priority?: string;
  sort?: "newest" | "oldest";
  page?: number;
}

export const Route = createFileRoute("/reports/")({
  validateSearch: (search: Record<string, unknown>): ReportSearch => ({
    search: typeof search.search === "string" ? search.search : undefined,
    category: typeof search.category === "string" ? search.category : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    priority: typeof search.priority === "string" ? search.priority : undefined,
    sort: search.sort === "oldest" ? "oldest" : undefined,
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse civic reports — Local Report Hub" },
      {
        name: "description",
        content:
          "Search and filter community reports by category, status and priority to see what's being fixed in your area.",
      },
      { property: "og:title", content: "Browse civic reports — Local Report Hub" },
      {
        property: "og:description",
        content: "Search and filter community civic reports by category, status and priority.",
      },
    ],
  }),
  component: BrowseReports,
});

function BrowseReports() {
  const navigate = useNavigate({ from: "/reports" });
  const search = Route.useSearch();

  const values = {
    search: search.search ?? "",
    category: search.category ?? "all",
    status: search.status ?? "all",
    priority: search.priority ?? "all",
    sort: search.sort ?? ("newest" as const),
  };
  const page = search.page ?? 1;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reports", "browse", values, page],
    queryFn: () => fetchReports({ ...values, page }),
    placeholderData: keepPreviousData,
  });

  function update(next: Partial<typeof values>) {
    const merged = { ...values, ...next };
    void navigate({
      search: {
        search: merged.search || undefined,
        category: merged.category === "all" ? undefined : merged.category,
        status: merged.status === "all" ? undefined : merged.status,
        priority: merged.priority === "all" ? undefined : merged.priority,
        sort: merged.sort === "newest" ? undefined : merged.sort,
        page: undefined,
      },
    });
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Community reports</h1>
            <p className="mt-2 text-muted-foreground">
              {data ? `${data.total} report${data.total === 1 ? "" : "s"} found` : "Loading reports..."}
            </p>
          </div>
          <Button asChild>
            <Link to="/reports/new">Report an issue</Link>
          </Button>
        </header>

        <FilterBar values={values} onChange={update} />

        <div className="mt-8">
          {isLoading ? (
            <ReportGridSkeleton />
          ) : isError ? (
            <EmptyState title="Couldn't load reports" description="Please refresh the page and try again." />
          ) : data && data.reports.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.reports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
              <PaginationBar
                page={page}
                total={data.total}
                pageSize={PAGE_SIZE}
                onPageChange={(next) =>
                  void navigate({
                    search: (prev: ReportSearch) => ({ ...prev, page: next > 1 ? next : undefined }),
                  })
                }
              />
            </>
          ) : (
            <EmptyState
              title="No matching reports"
              description="Try clearing a filter or searching for something else."
              action={
                <Button variant="outline" onClick={() => void navigate({ search: {} })}>
                  Clear filters
                </Button>
              }
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}
