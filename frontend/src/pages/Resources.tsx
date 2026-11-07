import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileStack,
  FileText,
  FlaskConical,
  FolderOpen,
  Link2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, LoadError, PageHeader, Spinner } from "@/components/bits";
import { apiGet } from "@/lib/api";
import type { ResourceItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const KINDS = ["All", "Syllabus", "Lab Manual", "Previous Paper", "Calendar", "Policy", "Link"];

const KIND_ICONS: Record<string, typeof FileText> = {
  Syllabus: FileText,
  "Lab Manual": FlaskConical,
  "Previous Paper": FileStack,
  Calendar: CalendarDays,
  Policy: ShieldCheck,
  Link: Link2,
};

const CONTACTS = [
  { name: "HOD Office — Dr. Hardeep Singh", detail: "hod.cse@mrsptu.ac.in", note: "Room A-201, CS Block • Mon–Fri 10 AM–4 PM", icon: Mail },
  { name: "Examination Cell", detail: "exam.cse@mrsptu.ac.in", note: "Ext. 234 • Hall tickets & form corrections", icon: Phone },
  { name: "Central Library", detail: "library@mrsptu.ac.in", note: "Ext. 156 • Book issues & late returns", icon: Phone },
  { name: "Anti-Ragging Helpline", detail: "1800-180-5522", note: "24×7 • University & UGC helpline", icon: ShieldCheck },
];

const FAQS = [
  {
    q: "How do I register for a club event?",
    a: "Open the Events section, pick an upcoming event and tap Register. Your RSVP is confirmed instantly and the club coordinator can see the headcount.",
  },
  {
    q: "Where do I find my examination hall ticket?",
    a: "Hall tickets are issued through the MRSPTU ERP portal a week before exams. Use the Exam Portal quick link on your dashboard.",
  },
  {
    q: "How is attendance calculated?",
    a: "Attendance is the average across all registered subjects in the semester. The university minimum is 75% to be eligible for end-semester examinations.",
  },
  {
    q: "Who do I contact for exam form corrections?",
    a: "Raise a ticket under Support with category 'Examination' — the department forwards corrections to the Examination Cell, usually within two working days.",
  },
];

export default function Resources() {
  const [kind, setKind] = useState("All");

  const query = useQuery({
    queryKey: ["resources"],
    queryFn: () => apiGet<ResourceItem[]>("/resources"),
  });

  const resources = (query.data ?? []).filter((r) => kind === "All" || r.kind === kind);

  return (
    <div className="space-y-8">
      <div>
        <PageHeader
          title="Campus Resources"
          description="Documents, links, contacts and answers to frequently asked questions."
        />

        <div className="mb-4 flex flex-wrap gap-2" data-testid="resource-kind-filters">
          {KINDS.map((k) => (
            <Button
              key={k}
              size="sm"
              variant={kind === k ? "default" : "outline"}
              data-testid={`resource-filter-${k.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setKind(k)}
            >
              {k}
            </Button>
          ))}
        </div>

        {query.isLoading ? (
          <Spinner label="Loading resources…" testid="resources-loading" />
        ) : query.isError ? (
          <LoadError what="resources" />
        ) : resources.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No resources here yet"
            message={kind === "All" ? "Resources will appear as the department adds them." : "Nothing filed under this category yet."}
            testid="resources-empty"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="resources-list">
            {resources.map((r) => {
              const Icon = KIND_ICONS[r.kind] ?? FileText;
              return (
                <Card key={r.id} data-testid={`resource-card-${r.id}`} className="flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex flex-1 flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="grid size-9 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                        <Icon className="size-4.5" />
                      </span>
                      <Badge variant="outline">{r.kind}</Badge>
                    </div>
                    <h3 className="font-heading text-base font-semibold leading-snug tracking-tight">{r.title}</h3>
                    <Badge variant="secondary" className="w-fit">{r.subject}</Badge>
                    <p className="flex-1 text-sm text-muted-foreground">{r.description}</p>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`resource-open-${r.id}`}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Open resource <ExternalLink className="size-3.5" />
                      </a>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* contacts */}
      <section>
        <h2 className="mb-3 font-heading text-xl font-bold tracking-tight">Important contacts</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="contacts-list">
          {CONTACTS.map(({ name, detail, note, icon: Icon }) => (
            <Card key={name} size="sm">
              <CardContent className="p-4">
                <span className="grid size-9 place-items-center rounded-lg bg-[#FEF3C7] text-[#78350F] dark:bg-[#78350F]/30 dark:text-[#FCD34D]">
                  <Icon className="size-4.5" />
                </span>
                <h3 className="mt-2 font-heading text-sm font-semibold tracking-tight">{name}</h3>
                <p className="text-sm font-medium text-primary">{detail}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {note}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-3 font-heading text-xl font-bold tracking-tight">Frequently asked questions</h2>
        <Card>
          <CardContent className="divide-y p-0">
            {FAQS.map((f, i) => (
              <details key={f.q} className="group" data-testid={`faq-item-${i}`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", "group-open:rotate-180")} />
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
