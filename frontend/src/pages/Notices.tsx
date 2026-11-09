import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Bell, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
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
import { EmptyState, LoadError, PageHeader, Spinner } from "@/components/bits";
import { apiGet } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { Notice } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Academic", "Examination", "Viva Voce", "Placement", "Hostel", "Sports"];

export default function Notices() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<Notice | null>(null);

  const query = useQuery({
    queryKey: ["notices", search, category],
    queryFn: () =>
      apiGet<Notice[]>(`/notices?search=${encodeURIComponent(search)}&category=${category === "All" ? "" : category}`),
    placeholderData: (prev) => prev, // keep the list visible while typing
  });

  const notices = query.data ?? [];
  const excerpt = useMemo(
    () => (n: Notice) => (n.body.length > 160 ? `${n.body.slice(0, 160)}…` : n.body),
    [],
  );

  return (
    <div>
      <PageHeader
        title="Notices & Announcements"
        description="Every circular from the department — searchable and categorized."
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="notices-search-input"
            placeholder="Search notices…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" data-testid="notice-category-filters">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              data-testid={`notice-filter-${c.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {query.isLoading ? (
        <Spinner label="Loading notices…" testid="notices-loading" />
      ) : query.isError ? (
        <LoadError what="notices" />
      ) : notices.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notices found"
          message={search || category !== "All" ? "Try a different search or category." : "The department hasn't published any notices yet."}
          testid="notices-empty"
        />
      ) : (
        <motion.ul
          key={`${category}-${search}`}
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="space-y-3"
          data-testid="notices-list"
        >
          {notices.map((n) => (
            <motion.li
              key={n.id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
            >
              <Card
                data-testid={`notice-card-${n.id}`}
                size="sm"
                className={cn(
                  "cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md",
                  !n.published && "opacity-60",
                )}
                onClick={() => setSelected(n)}
              >
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground font-heading text-xs font-bold">
                    {n.created_at ? format(parseISO(n.created_at.slice(0, 19)), "d MMM") : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{n.category}</Badge>
                      {!n.published ? <Badge variant="outline">Draft</Badge> : null}
                    </div>
                    <h3 className="mt-1 font-heading text-base font-semibold leading-snug tracking-tight">{n.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{excerpt(n)}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {fmtDate(n.created_at)}
                  </span>
                </CardContent>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      )}

      {/* detail reader */}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="notice-detail-dialog">
          {selected ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{selected.category}</Badge>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {fmtDate(selected.created_at)} • {selected.author}
                  </span>
                </div>
                <DialogTitle className="text-left font-heading text-xl leading-snug">{selected.title}</DialogTitle>
                <DialogDescription className="sr-only">Full notice text.</DialogDescription>
              </DialogHeader>
              <p className="max-h-[50vh] overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-foreground/90" data-testid="notice-detail-body">
                {selected.body}
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  data-testid="notice-download-button"
                  onClick={() => toast.info("The official signed copy is available on the department notice board and the ERP portal.")}
                >
                  <Download className="size-4" /> Official copy
                </Button>
                <Button data-testid="notice-detail-close-button" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
