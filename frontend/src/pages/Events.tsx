import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Code2, Cpu, Loader2, MapPin, Trophy, Users, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, LoadError, PageHeader, Spinner } from "@/components/bits";
import { apiErrorMessage, apiDelete, apiGet, apiPost } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { useSession } from "@/lib/session";
import { eventRegistrationSuccessMessage } from "@/lib/eventRegistrationMessage";
import type { CampusEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const CLUBS = [
  { name: "Coding Club", icon: Code2, members: 124, focus: "Contests, hackathons & open source" },
  { name: "Robotics Club", icon: Wrench, members: 86, focus: "Embedded systems & automation" },
  { name: "CSI Student Chapter", icon: Cpu, members: 212, focus: "Seminars, tech talks & publications" },
  { name: "ISTE Club", icon: Trophy, members: 158, focus: "Cultural events & talent showcase" },
];

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
type EventRegistrationResponse = { status: string; registered_count: number };

export default function Events() {
  const { data } = useSession();
  const user = data?.user ?? null;
  const queryClient = useQueryClient();
  const [pendingEventIds, setPendingEventIds] = useState<Set<string>>(() => new Set());

  const eventsQuery = useQuery({
    queryKey: ["events", "all"],
    queryFn: () => apiGet<CampusEvent[]>("/events?scope=all"),
  });

  const rsvp = useMutation({
    mutationFn: ({ ev, register }: { ev: CampusEvent; register: boolean }) =>
      register
        ? apiPost<EventRegistrationResponse>(`/events/${ev.id}/register`)
        : apiDelete<EventRegistrationResponse>(`/events/${ev.id}/register`),
    onSuccess: (_updated, { ev, register }) => {
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success(eventRegistrationSuccessMessage(register, ev.title));
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
    onMutate: ({ ev }) => {
      setPendingEventIds((current) => new Set(current).add(ev.id));
    },
    onSettled: (_updated, _error, { ev }) => {
      setPendingEventIds((current) => {
        const next = new Set(current);
        next.delete(ev.id);
        return next;
      });
    },
  });

  const events = eventsQuery.data ?? [];
  const upcoming = events.filter((e) => !e.is_past);
  const past = events.filter((e) => e.is_past).reverse();

  const EventCard = ({ ev }: { ev: CampusEvent }) => {
    const isRsvpPending = pendingEventIds.has(ev.id);
    return (
    <Card data-testid={`event-card-${ev.id}`} className="transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{ev.club}</Badge>
          <Badge variant="outline">{ev.category}</Badge>
        </div>
        <h3 className="font-heading text-base font-semibold leading-snug tracking-tight">{ev.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{ev.description}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="size-3.5" /> {fmtDateTime(ev.date)}</span>
          <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {ev.venue}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`event-registration-count-${ev.id}`}>
            <Users className="size-3.5" /> {ev.registered_count}/{ev.capacity} registered
          </span>
          {user?.role === "student" && !ev.is_past ? (
            ev.registered ? (
              <Button
                size="sm"
                variant="secondary"
                data-testid={`event-rsvp-button-${ev.id}`}
                onClick={() => rsvp.mutate({ ev, register: false })}
                disabled={isRsvpPending}
              >
                {isRsvpPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4 text-emerald-600" />}
                {isRsvpPending ? "Cancelling…" : "Registered — cancel"}
              </Button>
            ) : (
              <Button size="sm" data-testid={`event-rsvp-button-${ev.id}`} onClick={() => rsvp.mutate({ ev, register: true })} disabled={isRsvpPending}>
                {isRsvpPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {isRsvpPending ? "Registering…" : "Register"}
              </Button>
            )
          ) : user?.role === "admin" ? (
            <Link to="/admin/events" data-testid={`event-manage-link-${ev.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Manage
            </Link>
          ) : (
            <Badge variant="outline">Past event</Badge>
          )}
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Events & Clubs"
          description="Workshops, contests and cultural evenings across the department's student clubs."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CLUBS.map(({ name, icon: Icon, members, focus }) => (
            <Card key={name} size="sm" data-testid={`club-card-${slugify(name)}`} className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-4">
                <span className="grid size-9 place-items-center rounded-lg bg-[#FEF3C7] text-[#78350F] dark:bg-[#78350F]/30 dark:text-[#FCD34D]">
                  <Icon className="size-4.5" />
                </span>
                <h3 className="mt-2 font-heading text-sm font-semibold tracking-tight">{name}</h3>
                <p className="text-xs text-muted-foreground">{focus}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-primary">{members} members</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {eventsQuery.isLoading ? (
        <Spinner label="Loading events…" testid="events-loading" />
      ) : eventsQuery.isError ? (
        <LoadError what="events" />
      ) : (
        <>
          <section>
            <h2 className="mb-3 font-heading text-xl font-bold tracking-tight">Upcoming</h2>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No upcoming events" message="Check back soon — clubs post their events here." testid="events-upcoming-empty" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="events-upcoming-list">
                {upcoming.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 ? (
            <section>
              <h2 className="mb-3 font-heading text-xl font-bold tracking-tight">Past events</h2>
              <div className={cn("grid gap-4 opacity-75 md:grid-cols-2 xl:grid-cols-3")} data-testid="events-past-list">
                {past.map((ev) => (
                  <EventCard key={ev.id} ev={ev} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
