import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LifeBuoy, Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, LoadError, PageHeader, Spinner, StatusBadge } from "@/components/bits";
import { apiErrorMessage, apiGet, apiPost } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import type { Ticket, TicketInput } from "@/lib/types";

const CATEGORIES = ["IT & Network", "Examination", "Library", "Hostel", "Academics", "Other"];
const PRIORITIES = ["Low", "Medium", "High"];

export default function Support() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");

  const ticketsQuery = useQuery({
    queryKey: ["support", "mine"],
    queryFn: () => apiGet<Ticket[]>("/support/mine"),
  });

  const create = useMutation({
    mutationFn: (payload: TicketInput) => apiPost<Ticket>("/support", payload),
    onSuccess: (t) => {
      void queryClient.invalidateQueries({ queryKey: ["support"] });
      toast.success(`Request submitted — ticket raised for “${t.subject}”`);
      setSubject("");
      setDescription("");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const tickets = ticketsQuery.data ?? [];
  const canSubmit = subject.trim() !== "" && description.trim() !== "" && !create.isPending;

  return (
    <div>
      <PageHeader
        title="Student Support"
        description="Raise a campus query or complaint — and track how it gets resolved."
      />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        {/* new request form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading">New request</CardTitle>
            <CardDescription>Goes straight to the department helpdesk.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) create.mutate({ category, subject: subject.trim(), priority, description: description.trim() });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="ticket-category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="ticket-category" data-testid="ticket-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-subject">Subject</Label>
                <Input
                  id="ticket-subject"
                  data-testid="ticket-subject-input"
                  placeholder="One line summary"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="ticket-priority" data-testid="ticket-priority-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-description">Description</Label>
                <Textarea
                  id="ticket-description"
                  data-testid="ticket-description-textarea"
                  placeholder="Describe the issue — where it happens, since when, what you've already tried…"
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={!canSubmit} data-testid="submit-grievance-button">
                {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ticket history */}
        <div className="space-y-4 lg:col-span-3">
          <h2 className="font-heading text-lg font-bold tracking-tight">Your requests</h2>
          {ticketsQuery.isLoading ? (
            <Spinner label="Loading your tickets…" testid="tickets-loading" />
          ) : ticketsQuery.isError ? (
            <LoadError what="your requests" />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="No requests yet"
              message="Raise a query or complaint with the form — you'll be able to track its status here."
              testid="tickets-empty"
            />
          ) : (
            tickets.map((t) => (
              <Card key={t.id} data-testid={`ticket-card-${t.id}`}>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={t.status} testid={`ticket-status-${t.id}`} />
                    <Badge variant="outline">{t.category}</Badge>
                    <Badge
                      variant="outline"
                      className={
                        t.priority === "High"
                          ? "border-transparent bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : t.priority === "Medium"
                            ? "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }
                    >
                      {t.priority} priority
                    </Badge>
                    <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {fmtDateTime(t.created_at)}
                    </span>
                  </div>
                  <h3 className="font-heading text-base font-semibold tracking-tight">{t.subject}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t.description}</p>
                  <ol className="space-y-2.5 border-l-2 border-muted pl-4" data-testid={`ticket-timeline-${t.id}`}>
                    {t.updates.map((u, i) => (
                      <li key={i} className="relative text-sm">
                        <span className="absolute -left-[21.5px] top-1.5 size-2.5 rounded-full bg-primary/60 ring-2 ring-background" />
                        <p className="font-medium">
                          {u.note} <StatusBadge status={u.status} />
                        </p>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          {u.by} • {fmtDateTime(u.at)}
                        </p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
