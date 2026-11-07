import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LifeBuoy, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, LoadError, PageHeader, Spinner, StatusBadge } from "@/components/bits";
import { apiErrorMessage, apiGet, apiPatch } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { Ticket, TicketPatch } from "@/lib/types";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
];

const STATUS_VALUES = ["pending", "in_review", "resolved"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_review: "In review",
  resolved: "Resolved",
};

export default function AdminSupport() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [form, setForm] = useState<TicketPatch>({ status: "pending", note: "" });

  const ticketsQuery = useQuery({
    queryKey: ["admin-tickets", status],
    queryFn: () => apiGet<Ticket[]>(`/support?status=${status}`),
  });

  const update = useMutation({
    mutationFn: (payload: { id: string; patch: TicketPatch }) => apiPatch<Ticket>(`/support/${payload.id}`, payload.patch),
    onSuccess: (t) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["support"] });
      toast.success(`Ticket updated — now “${STATUS_LABELS[t.status]}”`);
      setSelected(null);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const openTicket = (t: Ticket) => {
    setSelected(t);
    setForm({ status: t.status, note: "" });
  };

  const tickets = ticketsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Student Helpdesk"
        description="Review student queries and complaints, and move them to resolution."
      />

      <div className="mb-4 flex flex-wrap gap-2" data-testid="admin-ticket-status-filters">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={status === f.value ? "default" : "outline"}
            data-testid={`admin-ticket-filter-${f.value || "all"}`}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {ticketsQuery.isLoading ? (
        <Spinner label="Loading tickets…" testid="admin-tickets-loading" />
      ) : ticketsQuery.isError ? (
        <LoadError what="support tickets" />
      ) : tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets here" message={status ? "No tickets with this status right now." : "When students raise requests they'll appear here."} testid="admin-tickets-empty" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table data-testid="admin-tickets-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden md:table-cell">Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Raised</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id} data-testid={`admin-ticket-row-${t.id}`}>
                    <TableCell className="max-w-56 whitespace-normal font-medium">{t.subject}</TableCell>
                    <TableCell className="hidden whitespace-normal md:table-cell">
                      {t.student_name}
                      <span className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{t.roll_no}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary">{t.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          t.priority === "High"
                            ? "border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            : t.priority === "Medium"
                              ? "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : ""
                        }
                      >
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} testid={`admin-ticket-status-${t.id}`} />
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs lg:table-cell">{fmtDateTime(t.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" data-testid={`admin-ticket-open-${t.id}`} onClick={() => openTicket(t)}>
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ticket detail + status update */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="ticket-detail-dialog">
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <Badge variant="outline">{selected.category}</Badge>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {fmtDateTime(selected.created_at)}
                  </span>
                </div>
                <DialogTitle className="text-left font-heading text-xl leading-snug">{selected.subject}</DialogTitle>
                <DialogDescription>
                  {selected.student_name} • {selected.roll_no} • {selected.priority} priority
                </DialogDescription>
              </DialogHeader>

              <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed" data-testid="ticket-detail-description">
                {selected.description}
              </p>

              <ol className="max-h-40 space-y-2 overflow-y-auto border-l-2 border-muted pl-4" data-testid="ticket-detail-timeline">
                {selected.updates.map((u, i) => (
                  <li key={i} className="relative text-sm">
                    <span className="absolute -left-[21.5px] top-1.5 size-2.5 rounded-full bg-primary/60 ring-2 ring-background" />
                    <p className="font-medium">{u.note}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {u.by} • {fmtDateTime(u.at)}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="space-y-3 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="ticket-status">Update status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                    <SelectTrigger id="ticket-status" data-testid="ticket-status-select">
                      <SelectValue>{STATUS_LABELS[form.status]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_VALUES.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ticket-note">Note to student</Label>
                  <Textarea
                    id="ticket-note"
                    data-testid="ticket-note-textarea"
                    rows={3}
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="e.g. Router replacement scheduled for tomorrow morning."
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" data-testid="ticket-update-cancel-button" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button
                  data-testid="ticket-update-button"
                  onClick={() => selected && update.mutate({ id: selected.id, patch: form })}
                  disabled={update.isPending}
                >
                  {update.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Update ticket
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
