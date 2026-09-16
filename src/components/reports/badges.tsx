/** Status and priority pills, driven entirely by design tokens. */
import { cn } from "@/lib/utils";
import type { ReportPriority, ReportStatus } from "@/lib/constants";

const STATUS_STYLES: Record<ReportStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-warning/15 text-warning-foreground dark:text-warning border-warning/30",
  },
  in_progress: { label: "In Progress", className: "bg-info/15 text-info border-info/30" },
  resolved: { label: "Resolved", className: "bg-success/15 text-success border-success/30" },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/12 text-destructive border-destructive/30",
  },
  under_review: { label: "Under Review", className: "bg-info/15 text-info border-info/30" },
  awaiting_verification: {
    label: "Awaiting Community Verification",
    className: "bg-warning/15 text-warning-foreground dark:text-warning border-warning/30",
  },
  verified_resolved: {
    label: "Verified Resolved",
    className: "bg-success/15 text-success border-success/30",
  },
  reopened: {
    label: "Reopened",
    className: "bg-destructive/12 text-destructive border-destructive/30",
  },
};

const PRIORITY_STYLES: Record<ReportPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-accent/20 text-accent-foreground dark:text-accent border-accent/40",
  high: "bg-destructive/12 text-destructive border-destructive/30",
};

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize";

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return <span className={cn(base, style.className, className)}>{style.label}</span>;
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: ReportPriority;
  className?: string;
}) {
  return (
    <span className={cn(base, PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.low, className)}>
      {priority} priority
    </span>
  );
}
