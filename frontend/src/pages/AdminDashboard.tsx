import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  FolderOpen,
  LifeBuoy,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadError, PageHeader, Spinner, StatusBadge, StatCard } from "@/components/bits";
import { apiGet } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import { useSession } from "@/lib/session";
import type { AdminStats, CampusEvent, Notice, Ticket } from "@/lib/types";

export default function AdminDashboard() {
  const { data } = useSession();
  const user = data?.user ?? null;

  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiGet<AdminStats>("/admin/stats"),
  });
  const noticesQuery = useQuery({
    queryKey: ["admin-notices", ""],
    queryFn: () => apiGet<Notice[]>("/notices?all=1"),
  });
  const eventsQuery = useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: () => apiGet<CampusEvent[]>("/events?scope=upcoming"),
  });
  const ticketsQuery = useQuery({
    queryKey: ["admin-tickets", ""],
    queryFn: () => apiGet<Ticket[]>("/support"),
  });

  const stats = statsQuery.data;
  const notices = (noticesQuery.data ?? []).slice(0, 5);
  const events = (eventsQuery.data ?? []).slice(0, 5);
  const tickets = (ticketsQuery.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Admin Console — ${user?.name ?? "Department"}`}
        description="CSE department overview: publications, events and student helpdesk at a glance."
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Notices published"
          value={stats ? `${stats.notices_published}/${stats.total_notices}` : "…"}
          icon={Bell}
          hint={stats ? `${stats.total_notices - stats.notices_published} draft(s)` : undefined}
          testid="admin-stat-notices"
        />
        <StatCard
          label="Active grievances"
          value={stats ? stats.active_tickets : "…"}
          icon={LifeBuoy}
          hint={stats ? `${stats.resolved_tickets} resolved all-time` : undefined}
          testid="admin-stat-tickets"
        />
        <StatCard
          label="Upcoming events"
          value={stats ? stats.upcoming_events : "…"}
          icon={CalendarDays}
          hint="Across all clubs"
          testid="admin-stat-events"
        />
        <StatCard
          label="Students"
          value={stats ? stats.students : "…"}
          icon={Users}
          hint={`${stats?.resources ?? "—"} resources filed`}
          testid="admin-stat-students"
        />
      </section>

      {/* quick actions */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/admin/notices", label: "Publish a notice", icon: Plus, testid: "admin-quick-notice" },
          { to: "/admin/events", label: "Add an event", icon: Plus, testid: "admin-quick-event" },
          { to: "/admin/resources", label: "Add a resource", icon: FolderOpen, testid: "admin-quick-resource" },
          { to: "/admin/support", label: "Resolve tickets", icon: ShieldCheck, testid: "admin-quick-support" },
        ].map(({ to, label, icon: Icon, testid }) => (
          <Link key={to} to={to} data-testid={testid} className={buttonVariants({ variant: "outline" }) + " justify-start"}>
            <Icon className="size-4 text-primary" /> {label}
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* recent notices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="font-heading">Recent notices</CardTitle>
              <CardDescription>Published & drafts</CardDescription>
            </div>
            <Link to="/admin/notices" data-testid="admin-view-notices-link" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Manage <ArrowRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {noticesQuery.isLoading ? (
              <Spinner label="Loading…" />
            ) : noticesQuery.isError ? (
              <LoadError what="notices" />
            ) : (
              <ul className="divide-y" data-testid="admin-recent-notices">
                {notices.map((n) => (
                  <li key={n.id} className="flex items-center gap-2 py-2">
                    <Badge variant="secondary" className="shrink-0">{n.category}</Badge>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{n.title}</p>
                    {n.published ? null : <Badge variant="outline">Draft</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* upcoming events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="font-heading">Upcoming events</CardTitle>
              <CardDescription>Next on campus</CardDescription>
            </div>
            <Link to="/admin/events" data-testid="admin-view-events-link" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Manage <ArrowRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {eventsQuery.isLoading ? (
              <Spinner label="Loading…" />
            ) : eventsQuery.isError ? (
              <LoadError what="events" />
            ) : (
              <ul className="divide-y" data-testid="admin-recent-events">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 py-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{e.title}</p>
                    <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {fmtDate(e.date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* latest tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="font-heading">Helpdesk</CardTitle>
              <CardDescription>Latest student requests</CardDescription>
            </div>
            <Link to="/admin/support" data-testid="admin-view-support-link" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Manage <ArrowRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {ticketsQuery.isLoading ? (
              <Spinner label="Loading…" />
            ) : ticketsQuery.isError ? (
              <LoadError what="support requests" />
            ) : (
              <ul className="divide-y" data-testid="admin-recent-tickets">
                {tickets.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 py-2">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{t.subject}</p>
                    <StatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
