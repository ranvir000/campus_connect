import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  testid,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  testid: string;
}) {
  return (
    <Card data-testid={testid} size="sm" className="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-heading text-2xl font-bold tracking-tight">{value}</p>
          {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  testid,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center"
    >
      <span className="grid size-12 place-items-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </span>
      <p className="font-heading text-base font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function Spinner({ label = "Loading…", testid }: { label?: string; testid?: string }) {
  return (
    <div data-testid={testid} className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// A region-level failure that still shows the page shell — never gate the page on a fetch.
export function LoadError({ what }: { what: string }) {
  return (
    <div className="rounded-xl border border-dashed px-6 py-8 text-center text-sm text-muted-foreground">
      Couldn&apos;t load {what} right now. Please try again later.
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  graded: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export function StatusBadge({ status, testid }: { status: string; testid?: string }) {
  const label = status.replace("_", " ");
  return (
    <Badge data-testid={testid} className={cn("border-transparent", STATUS_TONES[status])}>
      {label}
    </Badge>
  );
}
