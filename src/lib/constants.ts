/**
 * Shared domain constants: categories, statuses and priorities.
 * Keeping them in one place means the form, filters, badges and charts
 * always stay in sync.
 */
import {
  AlertTriangle,
  Construction,
  Droplets,
  Lightbulb,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  TrafficCone,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ReportStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected"
  | "under_review"
  | "awaiting_verification"
  | "verified_resolved"
  | "reopened";
export type ReportPriority = "low" | "medium" | "high";

export interface CategoryDef {
  value: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    value: "roads",
    label: "Roads",
    icon: Construction,
    description: "Potholes, broken roads, damaged footpaths",
  },
  {
    value: "garbage",
    label: "Garbage",
    icon: Trash2,
    description: "Illegal dumping, uncollected waste",
  },
  {
    value: "water",
    label: "Water Leakage",
    icon: Droplets,
    description: "Burst pipes, leaking mains, no supply",
  },
  {
    value: "street_lights",
    label: "Street Lights",
    icon: Lightbulb,
    description: "Dark streets, flickering lamps",
  },
  {
    value: "traffic",
    label: "Traffic",
    icon: TrafficCone,
    description: "Signal faults, congestion, illegal parking",
  },
  {
    value: "electricity",
    label: "Electricity",
    icon: Zap,
    description: "Outages, hanging wires, faulty poles",
  },
  {
    value: "drainage",
    label: "Drainage",
    icon: Waves,
    description: "Blocked drains, flooding, open manholes",
  },
  {
    value: "public_safety",
    label: "Public Safety",
    icon: ShieldCheck,
    description: "Hazards, vandalism, unsafe spots",
  },
  {
    value: "others",
    label: "Others",
    icon: MoreHorizontal,
    description: "Anything else worth reporting",
  },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.value, c])) as Record<
  string,
  CategoryDef
>;

export function categoryLabel(value: string) {
  return CATEGORY_MAP[value]?.label ?? "Others";
}

export function categoryIcon(value: string): LucideIcon {
  return CATEGORY_MAP[value]?.icon ?? AlertTriangle;
}

export const STATUSES: { value: ReportStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
  { value: "under_review", label: "Under Review" },
  { value: "awaiting_verification", label: "Awaiting Community Verification" },
  { value: "verified_resolved", label: "Verified Resolved" },
  { value: "reopened", label: "Reopened" },
];

/** Admin controls keep the legacy resolved value as the action that starts verification. */
export const ADMIN_STATUSES: { value: ReportStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved → start verification" },
  { value: "rejected", label: "Rejected" },
  { value: "under_review", label: "Under Review" },
  { value: "awaiting_verification", label: "Awaiting Community Verification" },
  { value: "verified_resolved", label: "Verified Resolved" },
  { value: "reopened", label: "Reopened" },
];

export function statusAfterAdminSelection(status: ReportStatus): ReportStatus {
  return status === "resolved" ? "awaiting_verification" : status;
}

export const PRIORITIES: { value: ReportPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PAGE_SIZE = 9;
