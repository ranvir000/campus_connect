import { useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Bell,
  GraduationCap,
  LogOut,
  Mail,
  Moon,
  Save,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/bits";
import { endSession, useSession } from "@/lib/session";
import { useDarkTheme } from "@/lib/theme";

export default function Profile() {
  const { data } = useSession();
  const user = data?.user ?? null;
  const isAdmin = user?.role === "admin";

  const [dark, setDark] = useDarkTheme();
  type Prefs = { notices: boolean; events: boolean; support: boolean };
  const [prefs, setPrefs] = useState<Prefs>(() => {
    try {
      return { notices: true, events: true, support: false, ...JSON.parse(localStorage.getItem("cc-prefs") ?? "{}") };
    } catch {
      return { notices: true, events: true, support: false };
    }
  });

  const toggleTheme = () => setDark(!dark);

  const initials = (user?.name ?? "")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const details: Array<[string, string]> = isAdmin
    ? [
        ["Designation", user?.designation ?? "—"],
        ["Department", user?.branch ?? "—"],
        ["Email", user?.email ?? "—"],
      ]
    : [
        ["Roll Number", user?.roll_no ?? "—"],
        ["Course", user?.branch ?? "—"],
        ["Semester", user?.semester ?? "—"],
        ["Batch", user?.batch ?? "—"],
        ["CGPA", user?.cgpa ?? "—"],
        ["Attendance", user?.attendance ?? "—"],
        ["Email", user?.email ?? "—"],
      ];

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Profile & Settings" description="Your details, viva status, notifications and appearance." />

      {/* identity card */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary font-heading text-xl font-bold text-primary-foreground" data-testid="profile-avatar">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-xl font-bold tracking-tight" data-testid="profile-name">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{isAdmin ? user?.designation : user?.semester}</p>
          </div>
          <Badge className="border-transparent bg-[#DBEAFE] text-[#1E3A8A] dark:bg-[#1E3A8A]/40 dark:text-[#BFDBFE]">
            {isAdmin ? <ShieldCheck className="size-3" /> : <GraduationCap className="size-3" />}
            {isAdmin ? "Administrator" : "Student"}
          </Badge>
        </CardContent>
      </Card>

      {/* details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{isAdmin ? "Department details" : "Academic details"}</CardTitle>
          <CardDescription>As per university records.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2" data-testid="profile-details">
            {details.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b pb-2">
                <dt className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">{k}</dt>
                <dd className="text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {!isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Viva defense status</CardTitle>
            <CardDescription>Major Project & Viva Defense (CS-804)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Badge className="border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <BadgeCheck className="size-3.5" /> Report submitted — Panel B
            </Badge>
            <p className="text-sm text-muted-foreground">
              “CampusConnect: Modern Micro-portal for University Operations” — reporting time 9:30 AM, bring two printed copies.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* notification preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Notification preferences</CardTitle>
          <CardDescription>Demonstration settings — saved locally for this demo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["notices", "Notice updates", "Exam schedules, viva panels and department circulars"],
              ["events", "Event invitations", "Club events, workshops and cultural evenings"],
              ["support", "Ticket updates", "Status changes on your support requests"],
            ] as const
          ).map(([key, label, desc]) => (
            <div key={key} className="flex items-center gap-3">
              <Checkbox
                id={`pref-${key}`}
                data-testid={`pref-checkbox-${key}`}
                checked={prefs[key]}
                onCheckedChange={(checked) => setPrefs((p) => ({ ...p, [key]: checked === true }))}
              />
              <div>
                <Label htmlFor={`pref-${key}`} className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            data-testid="profile-save-preferences-button"
            onClick={() => {
              localStorage.setItem("cc-prefs", JSON.stringify(prefs));
              toast.success("Preferences saved");
            }}
          >
            <Save className="size-4" /> Save preferences
          </Button>
        </CardContent>
      </Card>

      {/* appearance + sign out */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Appearance</CardTitle>
            <CardDescription>Currently using the {dark ? "midnight" : "daylight"} theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" data-testid="profile-theme-toggle-button" onClick={toggleTheme}>
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              Switch to {dark ? "light" : "dark"} mode
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Session</CardTitle>
            <CardDescription>Sign out of CampusConnect on this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" data-testid="profile-logout-button" onClick={() => void endSession("/")}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
