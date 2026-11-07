import type { ReactNode } from "react";
import { useDarkTheme } from "@/lib/theme";
import { Link, NavLink } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarDays,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Moon,
  Sun,
  UserCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { endSession, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const STUDENT_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/academics", label: "Academics", icon: BookOpen },
  { to: "/notices", label: "Notices", icon: Bell },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/resources", label: "Resources", icon: FolderOpen },
  { to: "/support", label: "Support", icon: LifeBuoy },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/notices", label: "Notices", icon: Bell },
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/resources", label: "Resources", icon: FolderOpen },
  { to: "/admin/support", label: "Support", icon: LifeBuoy },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

const slug = (label: string) => label.toLowerCase().replace(/\s+/g, "-");

export default function AppShell({ children }: { children: ReactNode }) {
  const { data } = useSession();
  const user = data?.user ?? null;
  const nav = user?.role === "admin" ? ADMIN_NAV : STUDENT_NAV;

  const [dark, setDark] = useDarkTheme();

  if (!user) return null; // RequireAuth guarantees a user before the shell mounts

  const handleLogout = () => void endSession("/");

  const sidebarCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
      isActive && "bg-secondary text-secondary-foreground",
    );

  const mobileCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex min-w-[72px] flex-1 flex-col items-center gap-0.5 px-2 py-2 text-[11px] font-medium text-muted-foreground",
      isActive && "text-primary",
    );

  return (
    <div className="min-h-svh bg-background">
      <header
        data-testid="app-header"
        className="sticky top-0 z-40 border-b border-border/70 bg-white/85 shadow-xs backdrop-blur-xl dark:bg-slate-950/85"
      >
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link
            to={user.role === "admin" ? "/admin" : "/dashboard"}
            data-testid="app-brand-link"
            className="flex items-center gap-2"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-heading text-base font-bold tracking-tight">CampusConnect</span>
            <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
              {user.role === "admin" ? "Admin Console" : "Student Portal"}
            </Badge>
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="mr-1 hidden text-right md:block" data-testid="header-user-chip">
              <p className="text-sm font-semibold leading-tight">{user.name}</p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {user.role === "admin" ? user.designation || "Administrator" : user.roll_no}
              </p>
            </div>
            <Button variant="ghost" size="icon" data-testid="theme-toggle-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">
              {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
            <Button variant="ghost" size="icon" data-testid="logout-button" onClick={handleLogout} aria-label="Sign out">
              <LogOut className="size-4.5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="sticky top-20 hidden h-fit w-52 shrink-0 lg:block">
          <nav data-testid="app-sidebar" className="flex flex-col gap-1">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} data-testid={`nav-${slug(label)}`} className={sidebarCls} end={to === "/admin"}>
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      <nav
        data-testid="mobile-bottom-nav"
        className="fixed inset-x-0 bottom-0 z-40 flex overflow-x-auto border-t border-border/70 bg-white/95 backdrop-blur-xl dark:bg-slate-950/95 lg:hidden"
      >
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} data-testid={`nav-mobile-${slug(label)}`} className={mobileCls} end={to === "/admin"}>
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
