/** Site footer with category shortcuts. */
import { Link } from "@tanstack/react-router";
import { Siren } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-display text-base font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Siren className="h-4 w-4" aria-hidden="true" />
            </span>
            Local Report Hub
          </div>
          <p className="text-sm text-muted-foreground">
            A community platform for reporting and tracking local civic issues until they are fixed.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/reports" className="hover:text-foreground">
                Browse reports
              </Link>
            </li>
            <li>
              <Link to="/reports/new" className="hover:text-foreground">
                Submit a report
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-foreground">
                My dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div className="sm:col-span-2">
          <h4 className="mb-3 text-sm font-semibold">Categories</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {CATEGORIES.map((c) => (
              <li key={c.value}>
                <Link
                  to="/reports"
                  search={{ category: c.value }}
                  className="hover:text-foreground"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Local Report Hub. Built for stronger neighbourhoods.
      </div>
    </footer>
  );
}
