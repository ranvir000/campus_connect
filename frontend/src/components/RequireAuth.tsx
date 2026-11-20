import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useSession } from "@/lib/session";
import type { UserRole } from "@/lib/types";

export function RequireAuth({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const { data, isLoading } = useSession();
  const location = useLocation();
  if (isLoading) return <div className="flex min-h-svh items-center justify-center bg-background"><Loader2 data-testid="auth-loading-spinner" className="size-8 animate-spin text-primary" /></div>;
  const user = data?.user ?? null;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === "site_admin" ? "/site-admin" : user.role === "faculty" ? "/faculty" : "/dashboard"} replace />;
  return <AppShell>{children}</AppShell>;
}
