import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useSession } from "@/lib/session";

// Gate for signed-in (optionally admin-only) pages; renders the app shell around children.
export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { data, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 data-testid="auth-loading-spinner" className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const user = data?.user ?? null;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (admin && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <AppShell>{children}</AppShell>;
}
