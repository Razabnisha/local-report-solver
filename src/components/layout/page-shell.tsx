/** Shared page shell: navbar + content + footer. */
import type { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: "primary" | "warning" | "info" | "success";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/15 text-info",
    success: "bg-success/15 text-success",
  } as const;

  return (
    <div className="surface-card flex items-center gap-4 p-5">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
