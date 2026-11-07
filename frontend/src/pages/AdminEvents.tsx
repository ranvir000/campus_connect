import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, LoadError, PageHeader, Spinner } from "@/components/bits";
import { apiErrorMessage, apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { CampusEvent, EventInput } from "@/lib/types";

const CLUBS = ["Coding Club", "Robotics Club", "CSI Student Chapter", "ISTE Club", "Other"];
const CATEGORIES = ["Technical", "Workshop", "Seminar", "Cultural", "Other"];

const toLocalInput = (iso: string) => iso.slice(0, 16);
const emptyForm = (): EventInput => ({
  title: "",
  club: CLUBS[0],
  category: CATEGORIES[0],
  description: "",
  venue: "",
  date: "",
  capacity: 100,
});

export default function AdminEvents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CampusEvent | null>(null);
  const [form, setForm] = useState<EventInput>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<CampusEvent | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["admin-events", search],
    queryFn: () => apiGet<CampusEvent[]>("/events?scope=all"),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    void queryClient.invalidateQueries({ queryKey: ["events"] });
  };

  const save = useMutation({
    mutationFn: (payload: EventInput) =>
      editing ? apiPut<CampusEvent>(`/events/${editing.id}`, payload) : apiPost<CampusEvent>("/events", payload),
    onSuccess: (ev) => {
      invalidate();
      setDialogOpen(false);
      toast.success(editing ? `Event updated: ${ev.title}` : `Event created: ${ev.title}`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/events/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success("Event deleted");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };
  const openEdit = (ev: CampusEvent) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      club: ev.club,
      category: ev.category,
      description: ev.description,
      venue: ev.venue,
      date: toLocalInput(ev.date),
      capacity: ev.capacity,
    });
    setDialogOpen(true);
  };

  const events = (eventsQuery.data ?? []).filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.club.toLowerCase().includes(search.toLowerCase()),
  );
  const canSave = form.title.trim() !== "" && form.date !== "" && form.venue.trim() !== "" && !save.isPending;

  return (
    <div>
      <PageHeader
        title="Manage Events"
        description="Add, edit and remove club events — RSVPs update for students instantly."
        action={
          <Button data-testid="create-event-button" onClick={openCreate}>
            <Plus className="size-4" /> New event
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="admin-events-search-input"
          placeholder="Search events or clubs…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {eventsQuery.isLoading ? (
        <Spinner label="Loading events…" testid="admin-events-loading" />
      ) : eventsQuery.isError ? (
        <LoadError what="events" />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events found" message={search ? "No matches for this search." : "Add the first event with “New event”."} testid="admin-events-empty" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table data-testid="admin-events-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Venue</TableHead>
                  <TableHead>RSVPs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev) => (
                  <TableRow key={ev.id} data-testid={`admin-event-row-${ev.id}`}>
                    <TableCell className="max-w-56 whitespace-normal font-medium">
                      {ev.title}
                      <Badge variant="outline" className="ml-2">{ev.category}</Badge>
                    </TableCell>
                    <TableCell>{ev.club}</TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">{fmtDateTime(ev.date)}</TableCell>
                    <TableCell className="hidden max-w-40 truncate lg:table-cell">{ev.venue}</TableCell>
                    <TableCell className="font-mono text-xs">{ev.registered_count}/{ev.capacity}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" data-testid={`admin-event-edit-${ev.id}`} aria-label={`Edit ${ev.title}`} onClick={() => openEdit(ev)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" className="text-destructive" data-testid={`admin-event-delete-${ev.id}`} aria-label={`Delete ${ev.title}`} onClick={() => setDeleteTarget(ev)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="event-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Edit event" : "New event"}</DialogTitle>
            <DialogDescription>Students see the event in the Events section immediately.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (canSave) save.mutate({ ...form, title: form.title.trim(), venue: form.venue.trim() });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="event-title">Title</Label>
              <Input id="event-title" data-testid="event-title-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. HackMRSPTU 2026" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-club">Club</Label>
                <Select value={form.club} onValueChange={(v) => setForm((f) => ({ ...f, club: v }))}>
                  <SelectTrigger id="event-club" data-testid="event-club-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLUBS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-category">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger id="event-category" data-testid="event-category-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-date">Date & time</Label>
                <Input id="event-date" data-testid="event-date-input" type="datetime-local" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-capacity">Capacity</Label>
                <Input id="event-capacity" data-testid="event-capacity-input" type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-venue">Venue</Label>
              <Input id="event-venue" data-testid="event-venue-input" value={form.venue} onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} placeholder="e.g. Seminar Hall A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea id="event-description" data-testid="event-description-textarea" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What's the event about?" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" data-testid="event-form-cancel-button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="event-form-submit-button" disabled={!canSave}>
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {editing ? "Save changes" : "Create event"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" data-testid="event-delete-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Delete this event?</DialogTitle>
            <DialogDescription>“{deleteTarget?.title}” and its registrations will be removed permanently.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" data-testid="event-delete-cancel-button" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" data-testid="event-delete-confirm-button" onClick={() => deleteTarget && remove.mutate(deleteTarget.id)} disabled={remove.isPending}>
              {remove.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
