import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { EmptyState, LoadError, PageHeader, Spinner, StatusBadge } from "@/components/bits";
import { apiErrorMessage, apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { Notice, NoticeInput } from "@/lib/types";

const CATEGORIES = ["Academic", "Examination", "Viva Voce", "Placement", "Hostel", "Sports"];
const EMPTY: NoticeInput = { title: "", category: CATEGORIES[0], body: "", published: true };

export default function AdminNotices() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState<NoticeInput>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);

  const noticesQuery = useQuery({
    queryKey: ["admin-notices", search],
    queryFn: () => apiGet<Notice[]>(`/notices?all=1&search=${encodeURIComponent(search)}`),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-notices"] });
    void queryClient.invalidateQueries({ queryKey: ["notices"] });
  };

  const save = useMutation({
    mutationFn: (payload: NoticeInput) =>
      editing ? apiPut<Notice>(`/notices/${editing.id}`, payload) : apiPost<Notice>("/notices", payload),
    onSuccess: (n) => {
      invalidate();
      setDialogOpen(false);
      toast.success(editing ? `Notice updated: ${n.title}` : `Notice published: ${n.title}`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const togglePublish = useMutation({
    mutationFn: (n: Notice) =>
      apiPut<Notice>(`/notices/${n.id}`, { title: n.title, category: n.category, body: n.body, published: !n.published }),
    onSuccess: (n) => {
      invalidate();
      toast.success(n.published ? `Published: ${n.title}` : `Unpublished: ${n.title}`);
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/notices/${id}`),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success("Notice deleted");
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  };
  const openEdit = (n: Notice) => {
    setEditing(n);
    setForm({ title: n.title, category: n.category, body: n.body, published: n.published });
    setDialogOpen(true);
  };

  const notices = noticesQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Manage Notices"
        description="Create, edit, publish and remove department circulars."
        action={
          <Button data-testid="create-notice-button" onClick={openCreate}>
            <Plus className="size-4" /> New notice
          </Button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          data-testid="admin-notices-search-input"
          placeholder="Search all notices…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {noticesQuery.isLoading ? (
        <Spinner label="Loading notices…" testid="admin-notices-loading" />
      ) : noticesQuery.isError ? (
        <LoadError what="notices" />
      ) : notices.length === 0 ? (
        <EmptyState icon={Bell} title="No notices found" message={search ? "No matches for this search." : "Publish the first circular with “New notice”."} testid="admin-notices-empty" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table data-testid="admin-notices-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((n) => (
                  <TableRow key={n.id} data-testid={`admin-notice-row-${n.id}`}>
                    <TableCell className="max-w-64 whitespace-normal font-medium">{n.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{n.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{n.author}</TableCell>
                    <TableCell>
                      <StatusBadge status={n.published ? "published" : "draft"} testid={`admin-notice-status-${n.id}`} />
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs sm:table-cell">{fmtDate(n.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" data-testid={`admin-notice-publish-toggle-${n.id}`} onClick={() => togglePublish.mutate(n)} disabled={togglePublish.isPending}>
                          {n.published ? "Unpublish" : "Publish"}
                        </Button>
                        <Button size="icon-sm" variant="ghost" data-testid={`admin-notice-edit-${n.id}`} aria-label={`Edit ${n.title}`} onClick={() => openEdit(n)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="icon-sm" variant="ghost" className="text-destructive" data-testid={`admin-notice-delete-${n.id}`} aria-label={`Delete ${n.title}`} onClick={() => setDeleteTarget(n)}>
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
        <DialogContent className="sm:max-w-lg" data-testid="notice-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">{editing ? "Edit notice" : "New notice"}</DialogTitle>
            <DialogDescription>Students see published notices immediately; drafts stay hidden.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.title.trim() && form.body.trim()) save.mutate({ ...form, title: form.title.trim(), body: form.body.trim() });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="notice-title">Title</Label>
              <Input id="notice-title" data-testid="notice-title-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Mid-Semester Examination Schedule" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-category">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger id="notice-category" data-testid="notice-category-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-body">Body</Label>
              <Textarea id="notice-body" data-testid="notice-body-textarea" rows={5} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Full circular text…" />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="notice-published"
                data-testid="notice-published-checkbox"
                type="checkbox"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="size-4 accent-[#1E3A8A]"
              />
              <Label htmlFor="notice-published">Publish immediately</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" data-testid="notice-form-cancel-button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" data-testid="notice-form-submit-button" disabled={!form.title.trim() || !form.body.trim() || save.isPending}>
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {editing ? "Save changes" : "Create notice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* delete confirm */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" data-testid="notice-delete-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Delete this notice?</DialogTitle>
            <DialogDescription>“{deleteTarget?.title}” will be removed permanently.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" data-testid="notice-delete-cancel-button" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" data-testid="notice-delete-confirm-button" onClick={() => deleteTarget && remove.mutate(deleteTarget.id)} disabled={remove.isPending}>
              {remove.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
