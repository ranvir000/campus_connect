import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Bell, CalendarDays, ClipboardList, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadError, Spinner, StatCard } from "@/components/bits";
import { apiGet } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { Assignment, CampusEvent, Notice, TodaySchedule } from "@/lib/types";

const QUICK_LINKS = [
  { label: "MRSPTU ERP", href: "https://erp.mrsptu.ac.in" },
  { label: "Digital LMS", href: "https://lms.mrsptu.ac.in" },
  { label: "Syllabus (PDF)", href: "https://www.mrsptu.ac.in/syllabus/btech-cse-8th-sem.pdf" },
  { label: "Exam Portal", href: "https://www.mrsptu.ac.in/examinations" },
];

export default function Dashboard() {
  const { data } = useSession();
  const user = data?.user ?? null;

  const todayQuery = useQuery({
    queryKey: ["today"],
    queryFn: () => apiGet<TodaySchedule>("/academics/today"),
  });
  const assignmentsQuery = useQuery({
    queryKey: ["assignments"],
    queryFn: () => apiGet<Assignment[]>("/academics/assignments"),
  });
  const noticesQuery = useQuery({
    queryKey: ["notices", "", ""],
    queryFn: () => apiGet<Notice[]>("/notices"),
  });
  const eventsQuery = useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: () => apiGet<CampusEvent[]>("/events?scope=upcoming"),
  });

  const assignments = assignmentsQuery.data ?? [];
  const pending = assignments.filter((a) => a.status === "pending");
  const notices = (noticesQuery.data ?? []).slice(0, 4);
  const events = (eventsQuery.data ?? []).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* greeting banner */}
      <section
        data-testid="dashboard-greeting"
        className="rounded-2xl bg-gradient-to-br from-[#0F2847] to-[#1E3A8A] p-6 text-white"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-transparent bg-[#FEF3C7] text-[#78350F]">{user?.roll_no}</Badge>
          <Badge className="border-transparent bg-[#DBEAFE] text-[#1E3A8A]">{user?.semester}</Badge>
        </div>
        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Hello, {user?.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-slate-300">
          {todayQuery.data
            ? `${todayQuery.data.day} — ${todayQuery.data.entries.length} class${todayQuery.data.entries.length === 1 ? "" : "es"} on today's schedule.`
            : "Here's what the department has planned for you."}
        </p>
      </section>

      {/* stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance" value={user?.attendance ?? "—"} icon={BadgeCheck} hint="Across all subjects" testid="stat-card-attendance" />
        <StatCard label="CGPA" value={user?.cgpa ?? "—"} icon={BadgeCheck} hint="Cumulative, up to 7th sem" testid="stat-card-cgpa" />
        <StatCard
          label="Pending work"
          value={assignmentsQuery.isError ? "—" : assignmentsQuery.isLoading ? "…" : pending.length}
          icon={ClipboardList}
          hint="Assignments to submit"
          testid="stat-card-pending-assignments"
        />
        <StatCard
          label="Upcoming events"
          value={eventsQuery.isError ? "—" : eventsQuery.isLoading ? "…" : (eventsQuery.data ?? []).length}
          icon={CalendarDays}
          hint="Clubs & department"
          testid="stat-card-upcoming-events"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* today's schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="font-heading">Today's timetable</CardTitle>
              <CardDescription>
                {todayQuery.data ? `${todayQuery.data.day} — Indian Standard Time` : "Loading schedule…"}
              </CardDescription>
            </div>
            <Link to="/academics" data-testid="dashboard-view-timetable-link" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Full week <ArrowRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {todayQuery.isLoading ? (
              <Spinner label="Loading today's classes…" testid="dashboard-today-loading" />
            ) : todayQuery.isError ? (
              <LoadError what="today's schedule" />
            ) : todayQuery.data && todayQuery.data.entries.length > 0 ? (
              <ul data-testid="dashboard-today-list" className="divide-y">
                {todayQuery.data.entries.map((e) => (
                  <li key={e.id} className="flex items-center gap-4 py-2.5">
                    <span className="w-24 shrink-0 font-mono text-xs font-semibold text-primary">
                      {e.start}–{e.end}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.subject}</p>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {e.code} • {e.room}
                      </p>
                    </div>
                    <Badge variant="outline">{e.kind}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No classes today"
                message="Enjoy the break — or use it to get ahead on your assignments."
                testid="dashboard-today-empty"
              />
            )}
          </CardContent>
        </Card>

        {/* pending assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Pending assignments</CardTitle>
            <CardDescription>Next due first</CardDescription>
          </CardHeader>
          <CardContent>
            {assignmentsQuery.isLoading ? (
              <Spinner label="Loading assignments…" />
            ) : assignmentsQuery.isError ? (
              <LoadError what="assignments" />
            ) : pending.length > 0 ? (
              <ul data-testid="dashboard-pending-list" className="space-y-3">
                {pending.slice(0, 3).map((a) => (
                  <li key={a.id} className="rounded-lg border p-3">
                    <p className="line-clamp-2 text-sm font-medium">{a.title}</p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {a.code} • due {fmtDate(a.due)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="All caught up"
                message="No pending assignments right now — nice work."
                testid="dashboard-pending-empty"
              />
            )}
          </CardContent>
        </Card>

        {/* latest notices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="font-heading">Latest notices</CardTitle>
              <CardDescription>From the department notice board</CardDescription>
            </div>
            <Link to="/notices" data-testid="dashboard-view-notices-link" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all <ArrowRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {noticesQuery.isLoading ? (
              <Spinner label="Loading notices…" />
            ) : noticesQuery.isError ? (
              <LoadError what="notices" />
            ) : notices.length > 0 ? (
              <ul data-testid="dashboard-notices-list" className="divide-y">
                {notices.map((n) => (
                  <li key={n.id} className="flex items-center gap-3 py-2.5">
                    <Badge variant="secondary" className="shrink-0">{n.category}</Badge>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{n.title}</p>
                    <span className="hidden shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground sm:block">
                      {fmtDate(n.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Bell}
                title="No notices yet"
                message="Department circulars will appear here as soon as they're published."
                testid="dashboard-notices-empty"
              />
            )}
          </CardContent>
        </Card>

        {/* upcoming events + quick links */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Upcoming events</CardTitle>
            <CardDescription>Clubs & department</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsQuery.isLoading ? (
              <Spinner label="Loading events…" />
            ) : eventsQuery.isError ? (
              <LoadError what="events" />
            ) : events.length > 0 ? (
              <ul data-testid="dashboard-events-list" className="space-y-3">
                {events.map((e) => (
                  <li key={e.id} className="rounded-lg border p-3">
                    <p className="line-clamp-2 text-sm font-medium">{e.title}</p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {e.club} • {fmtDate(e.date)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="Nothing scheduled"
                message="New club events will show up here."
                testid="dashboard-events-empty"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Quick links</CardTitle>
          <CardDescription>Official university portals, opens in a new tab</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`quick-link-${l.label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {l.label}
                <ExternalLink className="size-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
