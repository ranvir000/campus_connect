import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, Plus, ShieldCheck, Trash2, UserRoundCog, UserRoundX } from "lucide-react";
import { apiDelete, apiErrorMessage, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { AccountCreateInput, AccountRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, Spinner } from "@/components/bits";

type AccountRole = "student" | "faculty";
type FormState = {
  username: string;
  name: string;
  password: string;
  role: AccountRole;
  roll_no: string;
  branch: string;
  semester: string;
  designation: string;
};

const EMPTY_FORM: FormState = {
  username: "",
  name: "",
  password: "",
  role: "student",
  roll_no: "",
  branch: "B.Tech CSE",
  semester: "",
  designation: "",
};

export default function SiteAdminAccounts() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const accountsQuery = useQuery({
    queryKey: ["site-admin-accounts"],
    queryFn: () => apiGet<AccountRecord[]>("/site-admin/accounts"),
  });

  const createAccount = useMutation({
    mutationFn: (payload: AccountCreateInput) => apiPost<AccountRecord>("/site-admin/accounts", payload),
    onSuccess: () => {
      setForm(EMPTY_FORM);
      void queryClient.invalidateQueries({ queryKey: ["site-admin-accounts"] });
      toast.success("Account created. Share the username and password securely with its owner.");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiPatch<AccountRecord>(`/site-admin/accounts/${id}/status`, { is_active }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["site-admin-accounts"] }),
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const deleteAccount = useMutation({
    mutationFn: (id: string) => apiDelete<{ status: string }>(`/site-admin/accounts/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["site-admin-accounts"] });
      toast.success("Student account deleted.");
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: AccountCreateInput = {
      email: form.username.trim(),
      name: form.name.trim(),
      password: form.password,
      role: form.role,
    };
    if (form.role === "student") {
      payload.roll_no = form.roll_no.trim();
      payload.branch = form.branch.trim();
      payload.semester = form.semester.trim();
    } else {
      payload.designation = form.designation.trim();
    }
    createAccount.mutate(payload);
  };

  const accounts = accountsQuery.data ?? [];
  const students = accounts.filter((account) => account.role === "student");
  const faculty = accounts.filter((account) => account.role === "faculty");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account management"
        description="Provision student and faculty access. This workspace is limited to account controls."
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><UserRoundCog className="size-5" /></span>
            <div><p className="text-2xl font-bold">{accountsQuery.isSuccess ? students.length : "—"}</p><p className="text-sm text-muted-foreground">Student accounts</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <span className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"><ShieldCheck className="size-5" /></span>
            <div><p className="text-2xl font-bold">{accountsQuery.isSuccess ? faculty.length : "—"}</p><p className="text-sm text-muted-foreground">Faculty accounts · protected from deletion</p></div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading"><Plus className="size-4" /> Create an account</CardTitle>
          <CardDescription>Use the email address as the login username. Passwords are stored as hashes and are never shown in the roster.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="account-role">Account type</Label>
              <select id="account-role" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm" value={form.role} onChange={(event) => setField("role", event.target.value)}>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-username">Username (email)</Label>
              <Input id="account-username" type="email" autoComplete="off" required maxLength={254} value={form.username} onChange={(event) => setField("username", event.target.value)} placeholder="name@college.edu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-name">Full name</Label>
              <Input id="account-name" autoComplete="off" required minLength={2} maxLength={100} value={form.name} onChange={(event) => setField("name", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-password">Initial password</Label>
              <Input id="account-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={form.password} onChange={(event) => setField("password", event.target.value)} />
            </div>
            {form.role === "student" ? (
              <>
                <div className="space-y-2"><Label htmlFor="account-roll">Roll number</Label><Input id="account-roll" required maxLength={40} value={form.roll_no} onChange={(event) => setField("roll_no", event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="account-branch">Branch / course</Label><Input id="account-branch" required maxLength={100} value={form.branch} onChange={(event) => setField("branch", event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="account-semester">Semester</Label><Input id="account-semester" required maxLength={40} value={form.semester} onChange={(event) => setField("semester", event.target.value)} placeholder="e.g. 1st Semester" /></div>
              </>
            ) : (
              <div className="space-y-2"><Label htmlFor="account-designation">Designation (optional)</Label><Input id="account-designation" maxLength={100} value={form.designation} onChange={(event) => setField("designation", event.target.value)} placeholder="e.g. Lecturer" /></div>
            )}
            <div className="flex items-end"><Button type="submit" disabled={createAccount.isPending} className="w-full">{createAccount.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Create account</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Account roster</CardTitle>
          <CardDescription>Student access can be suspended or removed. Faculty accounts can be created here, but cannot be suspended or deleted by Site Admin.</CardDescription>
        </CardHeader>
        <CardContent>
          {accountsQuery.isLoading ? <Spinner label="Loading accounts…" /> : accountsQuery.isError ? (
            <p className="text-sm text-destructive">Could not load accounts. Please refresh and try again.</p>
          ) : accounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No student or faculty accounts found.</p>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary">
                    {account.role === "faculty" ? <ShieldCheck className="size-5" /> : <UserRoundCog className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{account.name}</p>
                      <Badge variant={account.is_active ? "secondary" : "outline"}>{account.is_active ? "Active" : "Suspended"}</Badge>
                      <Badge variant="outline">{account.role === "faculty" ? "Faculty" : "Student"}</Badge>
                    </div>
                    <p className="break-words text-sm text-muted-foreground">
                      {account.email}{account.role === "student" ? ` · ${account.roll_no ?? ""} · ${account.branch ?? ""} · ${account.semester ?? ""}` : account.designation ? ` · ${account.designation}` : ""}
                    </p>
                  </div>
                  {account.role === "student" ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={updateStatus.isPending} onClick={() => updateStatus.mutate({ id: account.id, is_active: !account.is_active })}>
                        {account.is_active ? <UserRoundX className="size-4" /> : <Check className="size-4" />}{account.is_active ? "Suspend" : "Reactivate"}
                      </Button>
                      <Button variant="destructive" size="sm" disabled={deleteAccount.isPending} onClick={() => {
                        if (window.confirm(`Delete the student account for ${account.name}? This cannot be undone.`)) deleteAccount.mutate(account.id);
                      }}>
                        <Trash2 className="size-4" /> Delete
                      </Button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><ShieldCheck className="size-4" /> Protected — no suspend/delete controls</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
