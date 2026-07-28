/** Home page: hero, search, categories, live statistics and recent reports. */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, Clock, Loader2, Search } from "lucide-react";
import heroImage from "@/assets/hero-city.jpg";
import { PageShell, StatCard } from "@/components/layout/page-shell";
import { ReportCard } from "@/components/reports/report-card";
import { ReportGridSkeleton, EmptyState } from "@/components/reports/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/constants";
import { fetchReports, fetchStats } from "@/lib/reports";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Local Report Hub — Report and track civic issues" },
      {
        name: "description",
        content:
          "Report potholes, garbage dumping, water leaks, street light failures and more. Track every civic complaint in your area from pending to resolved.",
      },
      { property: "og:title", content: "Local Report Hub — Report and track civic issues" },
      {
        property: "og:description",
        content:
          "A community platform for reporting local civic issues and following them until they are fixed.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: stats } = useQuery({ queryKey: ["stats", "global"], queryFn: () => fetchStats() });
  const { data: recent, isLoading } = useQuery({
    queryKey: ["reports", "recent"],
    queryFn: () => fetchReports({ page: 1, limit: 6, sort: "newest" }),
  });

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="A city street at dusk with a repaired road surface and a lit street lamp"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="hero-gradient absolute inset-0 opacity-90" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <div className="animate-fade-up max-w-2xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground backdrop-blur">
              Community-powered civic reporting
            </span>
            <h1 className="text-4xl font-bold leading-[1.05] text-primary-foreground sm:text-6xl">
              Your street. Your report. Real follow-up.
            </h1>
            <p className="max-w-xl text-base text-primary-foreground/80 sm:text-lg">
              Log potholes, overflowing bins, broken street lights and water leaks in under a minute —
              then watch each one move from pending to resolved.
            </p>

            <form
              className="flex max-w-lg gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/reports", search: { search: search.trim() || undefined } });
              }}
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reports near you..."
                  aria-label="Search reports"
                  className="h-12 border-transparent bg-background pl-9"
                />
              </div>
              <Button type="submit" size="lg" className="h-12">
                Search
              </Button>
            </form>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg" variant="secondary">
                <Link to="/reports/new">Report an issue</Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/reports">
                  Browse all reports <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4">
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
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-2xl font-bold sm:text-3xl">What can you report?</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Nine categories cover almost every day-to-day civic problem. Pick one to see what neighbours
          have already flagged.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <Link
              key={category.value}
              to="/reports"
              search={{ category: category.value }}
              className="surface-card lift-on-hover flex items-start gap-4 p-5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <category.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold">{category.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent reports */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Recent reports</h2>
            <p className="mt-2 text-muted-foreground">The latest issues raised by the community.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/reports">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <ReportGridSkeleton />
        ) : recent && recent.reports.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No reports yet"
            description="Be the first to flag something that needs fixing in your area."
            action={
              <Button asChild>
                <Link to="/reports/new">Create the first report</Link>
              </Button>
            }
          />
        )}
      </section>
    </PageShell>
  );
}
