import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import type { ResourceInput, ResourceItem } from "@/lib/types";

const KINDS = ["Syllabus", "Lab Manual", "Previous Paper", "Calendar", "Policy", "Link"];
const EMPTY: ResourceInput = { title: "", kind: KINDS[0], subject: "General", url: "", description: "" };

export default function AdminResources() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceItem | null>(null);
  const [form, setForm] = useState<ResourceInput>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<ResourceItem | null>(null);

  const resourcesQuery = useQuery({
    queryKey: ["resources"],
    queryFn: () => apiGet<ResourceItem[]>("/resources"),
  });

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["resources"] });

  const save = useMutation({
    mutationFn: (payload: ResourceInput) =>
      editing
        ? apiPut<ResourceItem>(`/resources/${editing.id}`, payload)
        : apiPost<ResourceItem>("/resources", payload),
    onSuccess: (r) => {
      invalidate();
      setDialogOpen(false);
      toast.success(editing ? `Resource updated: ${r.title}` : `Resource added: ${r.title}`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/resources/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success("Resource deleted");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (r: ResourceItem) => {
    setEditing(r);
    setForm({ title: r.title, kind: r.kind, subject: r.subject, url: r.url, description: r.description });
    setDialogOpen(true);
  };

  const resources = (resourcesQuery.data ?? []).filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.kind.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Manage Resources"
        description="Keep the syllabus copies, lab manuals, papers and portal links current."
        action={
          <Button data-testid="create-resource-button" onClick={openCreate}>
            <Plus className="size-4" /> New resource
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="admin-resources-search-input"
          placeholder="Search resources…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {resourcesQuery.isLoading ? (
        <Spinner label="Loading resources…" testid="admin-resources-loading" />
      ) : resourcesQuery.isError ? (
        <LoadError what="resources" />
      ) : resources.length === 0 ? (
        <EmptyState icon={ExternalLink} title="No resources found" message={search ? "No matches for this search." : "Add the first resource with “New resource”."} testid="admin-resources-empty" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table data-testid="admin-resources-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="hidden sm:table-cell">Subject</TableHead>
                  <TableHead className="hidden lg:table-cell">Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((r) => (
                  <TableRow key={r.id} data-testid={`admin-resource-row-${r.id}`}>
                    <TableCell className="max-w-64 whitespace-normal font-medium">{r.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.kind}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{r.subject}</TableCell>
                    <TableCell className="hidden max-w-48 lg:table-cell">
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate text-primary underline-offset-4 hover:underline">
                          <ExternalLink className="size-3.5 shrink-0" />
                          <span className="truncate">{r.url}</span>
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon-sm" variant="ghost" data-testid={`admin-resource-edit-${r.id}`} aria-label={`Edit ${r.title}`} onClick={() => openEdit(r)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" className="text-destructive" data-testid={`admin-resource-delete-${r.id}`} aria-label={`Delete ${r.title}`} onClick={() => setDeleteTarget(r)}>
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
        <DialogContent className="sm:max-w-lg" data-testid="resource-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Edit resource" : "New resource"}</DialogTitle>
            <DialogDescription>Documents and links shown in the student Resources section.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.title.trim()) save.mutate({ ...form, title: form.title.trim(), url: form.url.trim(), description: form.description.trim() });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="resource-title">Title</Label>
              <Input id="resource-title" data-testid="resource-title-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Machine Learning Lab Manual (CS-801)" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resource-kind">Kind</Label>
                <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v }))}>
                  <SelectTrigger id="resource-kind" data-testid="resource-kind-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KINDS.map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-subject">Subject / area</Label>
                <Input id="resource-subject" data-testid="resource-subject-input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="e.g. CS-801 or Student Welfare" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-url">URL</Label>
              <Input id="resource-url" data-testid="resource-url-input" type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-description">Description</Label>
              <Textarea id="resource-description" data-testid="resource-description-textarea" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" data-testid="resource-form-cancel-button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="resource-form-submit-button" disabled={!form.title.trim() || save.isPending}>
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {editing ? "Save changes" : "Create resource"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" data-testid="resource-delete-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Delete this resource?</DialogTitle>
            <DialogDescription>“{deleteTarget?.title}” will be removed permanently.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" data-testid="resource-delete-cancel-button" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" data-testid="resource-delete-confirm-button" onClick={() => deleteTarget && remove.mutate(deleteTarget.id)} disabled={remove.isPending}>
              {remove.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
