import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, CalendarDays, CheckCircle2, ClipboardList, Loader2, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, LoadError, PageHeader, Spinner, StatusBadge } from "@/components/bits";
import { apiErrorMessage, apiGet, apiPost } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { Assignment, Subject, TimetableEntry, TodaySchedule } from "@/lib/types";

function Bar({ value, tone }: { value: number; tone: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export default function Academics() {
  const [tab, setTab] = useState("subjects");

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: () => apiGet<Subject[]>("/academics/subjects"),
  });
  const timetableQuery = useQuery({
    queryKey: ["timetable"],
    queryFn: () => apiGet<TimetableEntry[]>("/academics/timetable"),
  });
  const todayQuery = useQuery({
    queryKey: ["today"],
    queryFn: () => apiGet<TodaySchedule>("/academics/today"),
  });
  const assignmentsQuery = useQuery({
    queryKey: ["assignments"],
    queryFn: () => apiGet<Assignment[]>("/academics/assignments"),
  });

  const assignments = assignmentsQuery.data ?? [];
  const pending = assignments.filter((a) => a.status === "pending");
  const graded = assignments.filter((a) => a.status === "graded");

  return (
    <div>
      <PageHeader
        title="Academics"
        description="Subjects, weekly timetable and assignments for the current semester."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList data-testid="academics-tabs">
          <TabsTrigger value="subjects" data-testid="tab-subjects">Subjects</TabsTrigger>
          <TabsTrigger value="timetable" data-testid="tab-timetable">Timetable</TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments{pending.length > 0 ? ` (${pending.length})` : ""}
          </TabsTrigger>
        </TabsList>

        {/* subjects */}
        <TabsContent value="subjects" className="mt-6">
          {subjectsQuery.isLoading ? (
            <Spinner label="Loading subjects…" testid="subjects-loading" />
          ) : subjectsQuery.isError ? (
            <LoadError what="subjects" />
          ) : subjectsQuery.data && subjectsQuery.data.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {subjectsQuery.data.map((s) => (
                <Card key={s.id} data-testid={`subject-card-${s.code.toLowerCase()}`} className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="secondary">{s.code}</Badge>
                        <h3 className="mt-2 font-heading text-base font-semibold leading-snug tracking-tight">{s.name}</h3>
                      </div>
                      <span className="shrink-0 rounded-lg bg-muted px-2 py-1 text-center">
                        <span className="block font-heading text-sm font-bold leading-none">{s.credits}</span>
                        <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">credits</span>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.faculty}</p>
                    <div className="space-y-2.5">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Percent className="size-3" /> Attendance
                          </span>
                          <span className="font-mono font-semibold">{s.attendance_pct}%</span>
                        </div>
                        <Bar value={s.attendance_pct} tone="bg-emerald-500" />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Syllabus progress</span>
                          <span className="font-mono font-semibold">{s.progress_pct}%</span>
                        </div>
                        <Bar value={s.progress_pct} tone="bg-primary" />
                      </div>
                    </div>
                    <Badge
                      className={
                        s.viva_status === "prepared"
                          ? "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }
                    >
                      {s.viva_status === "prepared" ? "Viva ready" : "Preparation in progress"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState icon={BookOpen} title="No subjects" message="Subjects for this semester haven't been added yet." testid="subjects-empty" />
          )}
        </TabsContent>

        {/* timetable */}
        <TabsContent value="timetable" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Weekly timetable</CardTitle>
              <CardDescription>
                {todayQuery.data ? `Today is ${todayQuery.data.day} — highlighted below.` : "Lectures, labs and tutorials."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timetableQuery.isLoading ? (
                <Spinner label="Loading timetable…" testid="timetable-loading" />
              ) : timetableQuery.isError ? (
                <LoadError what="the timetable" />
              ) : timetableQuery.data && timetableQuery.data.length > 0 ? (
                <Table data-testid="timetable-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead className="hidden sm:table-cell">Faculty</TableHead>
                      <TableHead>Kind</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timetableQuery.data.map((e) => {
                      const isToday = todayQuery.data?.day === e.day;
                      return (
                        <TableRow
                          key={e.id}
                          data-testid={`timetable-row-${e.day.toLowerCase()}-${e.start.replace(":", "")}`}
                          className={isToday ? "bg-secondary/60" : undefined}
                        >
                          <TableCell className="font-medium">
                            {e.day}
                            {isToday ? <Badge variant="secondary" className="ml-2">Today</Badge> : null}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{e.start}–{e.end}</TableCell>
                          <TableCell>
                            <span className="font-medium">{e.subject}</span>
                            <span className="block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{e.code}</span>
                          </TableCell>
                          <TableCell>{e.room}</TableCell>
                          <TableCell className="hidden sm:table-cell">{e.faculty}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{e.kind}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState icon={CalendarDays} title="Timetable not published" message="The weekly timetable will appear here once the department publishes it." testid="timetable-empty" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* assignments */}
        <TabsContent value="assignments" className="mt-6">
          <div className="space-y-6">
            {assignmentsQuery.isLoading ? (
              <Spinner label="Loading assignments…" testid="assignments-loading" />
            ) : assignmentsQuery.isError ? (
              <LoadError what="assignments" />
            ) : assignments.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No assignments" message="Nothing assigned in this semester yet." testid="assignments-empty" />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {[...pending, ...assignments.filter((a) => a.status !== "pending")].map((a) => (
                  <Card key={a.id} data-testid={`assignment-card-${a.id}`}>
                    <CardContent className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <Badge variant="secondary">{a.code}</Badge>
                        <StatusBadge status={a.status} testid={`assignment-status-${a.id}`} />
                      </div>
                      <h3 className="font-heading text-base font-semibold leading-snug tracking-tight">{a.title}</h3>
                      <p className="text-sm text-muted-foreground">{a.subject}</p>
                      <div className="flex items-center justify-between gap-3 border-t pt-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {a.status === "pending" ? `Due ${fmtDate(a.due)}` : a.status === "submitted" ? `Submitted ${fmtDate(a.submitted_at ?? a.due)}` : `Graded ${a.marks}/100`}
                        </span>
                        {a.status === "pending" ? (
                          <SubmitButton id={a.id} title={a.title} />
                        ) : a.status === "graded" ? (
                          <Badge className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="size-3" /> {a.marks}/100
                          </Badge>
                        ) : (
                          <Badge variant="outline">Awaiting grade</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {graded.length > 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                {graded.length} graded assignment{graded.length === 1 ? "" : "s"} this semester — average{" "}
                <span className="font-semibold text-foreground">
                  {Math.round(graded.reduce((sum, a) => sum + (a.marks ?? 0), 0) / graded.length)}/100
                </span>
              </p>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubmitButton({ id, title }: { id: string; title: string }) {
  const queryClient = useQueryClient();
  const submit = useMutation({
    mutationFn: () => apiPost<Assignment>(`/academics/assignments/${id}/submit`),
    onSuccess: () => {
      toast.success(`Submitted: ${title}`);
      void queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });
  return (
    <Button size="sm" data-testid={`assignment-submit-button-${id}`} onClick={() => submit.mutate()} disabled={submit.isPending}>
      {submit.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
      Mark submitted
    </Button>
  );
}
