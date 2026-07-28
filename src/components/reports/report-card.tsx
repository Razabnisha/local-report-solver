/** Card used in every report grid across the app. */
import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { categoryIcon, categoryLabel } from "@/lib/constants";
import type { ReportWithAuthor } from "@/lib/types";
import { PriorityBadge, StatusBadge } from "./badges";
import { ReportImage } from "./report-image";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReportCard({ report }: { report: ReportWithAuthor }) {
  const Icon = categoryIcon(report.category);

  return (
    <Link
      to="/reports/$reportId"
      params={{ reportId: report.id }}
      className="surface-card lift-on-hover group flex h-full flex-col overflow-hidden"
    >
      <div className="relative h-44 w-full overflow-hidden">
        <ReportImage
          path={report.image_url}
          alt={report.title}
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <StatusBadge status={report.status} className="backdrop-blur-sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          {categoryLabel(report.category)}
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold leading-snug">{report.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{report.description}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="line-clamp-1 max-w-[10rem]">{report.location || "Unspecified"}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(report.created_at)}
          </span>
          <PriorityBadge priority={report.priority} className="ml-auto" />
        </div>
      </div>
    </Link>
  );
}
