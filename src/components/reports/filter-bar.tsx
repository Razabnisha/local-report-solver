/** Search + filter toolbar shared by the browse page and the admin console. */
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/constants";

export interface FilterValues {
  search: string;
  category: string;
  status: string;
  priority: string;
  sort: "newest" | "oldest";
}

export function FilterBar({
  values,
  onChange,
}: {
  values: FilterValues;
  onChange: (next: Partial<FilterValues>) => void;
}) {
  return (
    <div className="surface-card grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,9rem))]">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={values.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search reports by title..."
          className="pl-9"
          aria-label="Search reports by title"
        />
      </div>

      <Select value={values.category} onValueChange={(v) => onChange({ category: v })}>
        <SelectTrigger aria-label="Filter by category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.status} onValueChange={(v) => onChange({ status: v })}>
        <SelectTrigger aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.priority} onValueChange={(v) => onChange({ priority: v })}>
        <SelectTrigger aria-label="Filter by priority">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={values.sort} onValueChange={(v) => onChange({ sort: v as "newest" | "oldest" })}>
        <SelectTrigger aria-label="Sort reports">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="oldest">Oldest first</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function PaginationBar({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
      >
        Previous
      </button>
      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i + 1)}
          aria-current={page === i + 1 ? "page" : undefined}
          className={
            page === i + 1
              ? "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              : "rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          }
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}
