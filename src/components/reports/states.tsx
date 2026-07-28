/** Loading skeletons and empty state illustration. */
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function ReportCardSkeleton() {
  return (
    <div className="surface-card overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function ReportGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ReportCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <svg
        viewBox="0 0 120 90"
        className="h-24 w-32 text-muted-foreground/50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="14" y="18" width="70" height="54" rx="8" />
        <path d="M14 34h70" />
        <circle cx="24" cy="26" r="2" />
        <circle cx="32" cy="26" r="2" />
        <path d="M30 50h30M30 60h20" />
        <circle cx="92" cy="60" r="16" className="text-accent" />
        <path d="M92 52v10M92 68v.5" className="text-accent" />
      </svg>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
