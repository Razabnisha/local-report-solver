/** Create a new report (requires sign-in). */
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { ReportForm } from "@/components/reports/report-form";

export const Route = createFileRoute("/_authenticated/reports/new")({
  head: () => ({
    meta: [
      { title: "Submit a report — Local Report Hub" },
      {
        name: "description",
        content: "Describe a local civic issue, add a photo and location, and submit it to your community.",
      },
      { property: "og:title", content: "Submit a report — Local Report Hub" },
      { property: "og:description", content: "Describe a local civic issue and submit it to your community." },
    ],
  }),
  component: NewReport,
});

function NewReport() {
  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Report an issue</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The more detail you add — a clear photo, an exact location and a short description — the faster
            it can be triaged.
          </p>
        </header>
        <ReportForm />
      </div>
    </PageShell>
  );
}
