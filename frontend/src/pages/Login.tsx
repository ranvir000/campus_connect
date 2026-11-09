import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { GraduationCap, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { apiErrorMessage, apiPost } from "@/lib/api";
import { beginSession } from "@/lib/session";
import type { SessionUser } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HERO_IMG =
  "https://images.unsplash.com/photo-1623631484725-fef26b75b402?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwyfHxjb2xsZWdlJTIwdW5pdmVyc2l0eSUyMGNhbXB1c3xlbnwwfHx8fDE3OTM5NzAzODd8MA&ixlib=rb-4.1.0&q=85";

const DEMO: Record<"student" | "admin", { email: string; password: string; hint: string }> = {
  student: {
    email: "aman.cse084@mrsptu.ac.in",
    password: "",
    hint: "Amanpreet Singh — B.Tech CSE, 8th Semester (Roll 2021CSE084)",
  },
  admin: {
    email: "hod.cse@mrsptu.ac.in",
    password: "",
    hint: "Dr. Hardeep Singh — Head of Department, CSE",
  },
};

type Role = "student" | "admin";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialRole: Role = (location.state as { role?: string } | null)?.role === "admin" ? "admin" : "student";
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState(DEMO[initialRole].email);
  const [password, setPassword] = useState(DEMO[initialRole].password);

  const login = useMutation({
    mutationFn: (payload: { email: string; password: string }) => apiPost<SessionUser>("/auth/login", payload),
    onSuccess: (user) => {
      beginSession();
      toast.success(`Welcome, ${user.name}!`);
      const from = (location.state as { from?: string } | null)?.from;
      const target = from && from !== "/login" ? from : user.role === "admin" ? "/admin" : "/dashboard";
      navigate(target, { replace: true });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const switchRole = (value: string) => {
    const next = value as Role;
    setRole(next);
    setEmail(DEMO[next].email);
    setPassword(DEMO[next].password);
  };

  const canSubmit = email.trim() !== "" && password !== "" && !login.isPending;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0B192C] p-10 text-white lg:flex">
        <img src={HERO_IMG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B192C]/95 via-[#0F2847]/85 to-[#1E3A8A]/80" />
        <div className="relative">
          <span className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-white/15">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">CampusConnect</span>
          </span>
        </div>
        <div className="relative max-w-md">
          <Badge className="mb-4 border border-white/20 bg-white/10 text-white">MRSPTU • Bathinda</Badge>
          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight">
            Welcome back to the department.
          </h1>
          <p className="mt-3 text-slate-300">
            Your timetable, circulars, events and support desk — exactly where you left them.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">
          Department of Computer Science & Engineering • B.Tech CSE demonstration portal
        </p>
      </div>

      {/* right form panel */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Sign in</CardTitle>
            <CardDescription>Choose your role — demo credentials are prefilled for the viva.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs value={role} onValueChange={switchRole}>
              <TabsList data-testid="login-role-tabs" className="grid w-full grid-cols-2">
                <TabsTrigger value="student" data-testid="login-tab-student">
                  Student
                </TabsTrigger>
                <TabsTrigger value="admin" data-testid="login-tab-admin">
                  Administrator
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="rounded-lg border border-dashed bg-secondary/40 px-3 py-2" data-testid="demo-credentials-hint">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Demo credentials
              </p>
              <p className="mt-0.5 text-xs text-foreground/90">{DEMO[role].hint}</p>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) login.mutate({ email: email.trim(), password });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  data-testid="login-email-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@mrsptu.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  data-testid="login-password-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={!canSubmit} data-testid="login-submit-button">
                {login.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : role === "admin" ? (
                  <ShieldCheck className="size-4" />
                ) : (
                  <LogIn className="size-4" />
                )}
                Sign in as {role === "admin" ? "Administrator" : "Student"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/" className="font-medium text-primary underline-offset-4 hover:underline">
                ← Back to the campus overview
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
