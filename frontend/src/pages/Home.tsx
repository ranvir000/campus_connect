import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api";
import { fmtDate } from "@/lib/format";
import type { CampusEvent, Notice } from "@/lib/types";

const HERO_IMG =
  "https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwdW5pdmVyc2l0eSUyMGNhbXB1c3xlbnwwfHx8fDE3OTM5NzAzODd8MA&ixlib=rb-4.1.0&q=85";
const LAB_IMG =
  "https://images.unsplash.com/photo-1569653402334-2e98fbaa80ee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwxfHBpbmRpYW4lMjB1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjB0ZWNofGVufDB8fHx8MTc5Mzk3MDM4N3ww&ixlib=rb-4.1.0&q=85";

// Shown only while/if the live fetch is unavailable (e.g. static preview) — the
// page itself always renders.
const SAMPLE_NOTICES: Notice[] = [
  { id: "s1", title: "Mid-Semester Examination Schedule — 8th Semester", category: "Examination", body: "", author: "Dr. Hardeep Singh", published: true, created_at: "" },
  { id: "s2", title: "Major Project Viva Voce — Panel Allotment", category: "Viva Voce", body: "", author: "Dr. Hardeep Singh", published: true, created_at: "" },
  { id: "s3", title: "TCS NQT Campus Drive — Registration Open", category: "Placement", body: "", author: "Training & Placement Cell", published: true, created_at: "" },
];

const SAMPLE_EVENTS: CampusEvent[] = [
  { id: "s1", title: "HackMRSPTU 2026 — 24-Hour Hackathon", club: "Coding Club", category: "Technical", description: "", venue: "Seminar Hall A", date: "", capacity: 150, registered: null, registered_count: 96, is_past: false },
  { id: "s2", title: "Line-Follower Robotics Workshop", club: "Robotics Club", category: "Workshop", description: "", venue: "Robotics Lab", date: "", capacity: 60, registered: null, registered_count: 41, is_past: false },
];

const FEATURES = [
  { icon: BookOpen, title: "Academics", text: "Subjects, weekly timetable, assignments and study resources with progress you can actually read at a glance." },
  { icon: Bell, title: "Notices", text: "Every circular from the department — exam schedules, viva voce panels, placement drives — searchable and categorized." },
  { icon: CalendarDays, title: "Events & Clubs", text: "Hackathons, workshops, tech talks and cultural evenings from Coding, Robotics, CSI and ISTE clubs. One-tap RSVP." },
  { icon: FolderOpen, title: "Campus Resources", text: "Syllabus copies, lab manuals, previous papers, academic calendar and official portal links in one shelf." },
  { icon: LifeBuoy, title: "Student Support", text: "Raise a campus query or complaint and track its journey from pending to resolved with a live ticket timeline." },
  { icon: ShieldCheck, title: "Admin Console", text: "The HOD's office publishes notices, curates events and resources, and resolves student tickets from a single dashboard." },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Home() {
  const noticesQuery = useQuery({
    queryKey: ["public-notices"],
    queryFn: () => apiGet<Notice[]>("/notices"),
    retry: false,
  });
  const eventsQuery = useQuery({
    queryKey: ["public-events"],
    queryFn: () => apiGet<CampusEvent[]>("/events?scope=upcoming"),
    retry: false,
  });

  const notices = (noticesQuery.data ?? SAMPLE_NOTICES).slice(0, 4);
  const events = (eventsQuery.data ?? SAMPLE_EVENTS).filter((e) => !e.is_past).slice(0, 3);

  return (
    <div className="min-h-svh bg-background">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 shadow-xs backdrop-blur-xl dark:bg-slate-950/85">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
          <span className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-heading text-base font-bold tracking-tight">CampusConnect</span>
            <Badge className="ml-1 hidden border-transparent bg-[#FEF3C7] text-[#78350F] dark:bg-[#78350F]/30 dark:text-[#FCD34D] sm:inline-flex">
              MRSPTU • B.Tech CSE
            </Badge>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" data-testid="header-student-login-link" render={<Link to="/login" />}>
              Student Login
            </Button>
            <Button data-testid="header-admin-login-link" render={<Link to="/login" state={{ role: "admin" }} />}>
              <ShieldCheck className="size-4" /> Admin
            </Button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="border-b border-border/70 bg-gradient-to-br from-[#0B192C] via-[#0F2847] to-[#1E3A8A] text-white">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-4 border border-white/20 bg-white/10 text-white">Department of Computer Science & Engineering</Badge>
            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              One portal for every <span className="text-[#FCD34D]">campus</span> need.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-300">
              CampusConnect brings academics, notices, events, resources and student support together for the
              MRSPTU B.Tech CSE department — no more pinboards and PDFs buried in WhatsApp groups.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" data-testid="hero-student-login-button" render={<Link to="/login" />}>
                Student Login <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                data-testid="hero-admin-login-button"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                render={<Link to="/login" state={{ role: "admin" }} />}
              >
                Administrator Login
              </Button>
            </div>
            <dl className="mt-8 flex flex-wrap gap-8">
              {[
                ["4,200+", "students on campus"],
                ["8", "semesters covered"],
                ["100%", "digital syllabus"],
                ["40+", "clubs & societies"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-heading text-2xl font-bold">{v}</dt>
                  <dd className="text-xs uppercase tracking-wider text-slate-400">{l}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative"
          >
            <img
              src={HERO_IMG}
              alt="MRSPTU campus buildings and lawns"
              className="aspect-[4/3] w-full rounded-2xl border border-white/10 object-cover shadow-2xl"
            />
            <Card className="absolute -bottom-6 -left-4 w-72 border-white/10 bg-white/95 shadow-xl backdrop-blur sm:-left-8 dark:bg-slate-900/95">
              <CardContent className="p-4">
                <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Latest circulars
                </p>
                <ul className="space-y-2">
                  {notices.slice(0, 3).map((n) => (
                    <li key={n.id} className="flex items-start gap-2 text-xs">
                      <Badge variant="secondary" className="mt-0.5 h-4 shrink-0 px-1.5 text-[10px]">{n.category}</Badge>
                      <span className="line-clamp-2 text-foreground/90">{n.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* features */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#D97706]">What's inside</p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">Everything a student needs, in one place</h2>
          <p className="mt-2 text-muted-foreground">
            Six connected sections replace a dozen scattered links — and an admin console keeps every piece of it current.
          </p>
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <motion.div key={title} variants={fadeUp}>
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-3 font-heading text-lg font-semibold tracking-tight">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* live preview strip */}
      <section className="border-y border-border/70 bg-muted/50">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold tracking-tight">From the notice board</h2>
              <Link to="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                Sign in to read all
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {notices.map((n) => (
                <li key={n.id}>
                  <Card size="sm" className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                      <Badge variant="outline" className="shrink-0">{n.category}</Badge>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{n.title}</p>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          {n.author}{n.created_at ? ` • ${fmtDate(n.created_at)}` : ""}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-2xl font-bold tracking-tight">Coming up on campus</h2>
              <Link to="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                Sign in to RSVP
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {events.map((e) => (
                <li key={e.id}>
                  <Card size="sm" className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <CardContent className="flex items-center gap-3 p-4">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#FEF3C7] text-[#78350F] dark:bg-[#78350F]/30 dark:text-[#FCD34D]">
                        <CalendarDays className="size-4.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.title}</p>
                        <p className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          <MapPin className="size-3" /> {e.venue}
                          {e.date ? ` • ${fmtDate(e.date)}` : ""}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* viva band */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 rounded-2xl border border-border/70 bg-card p-8 lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[#D97706]">For the viva panel</p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">Demo accounts are ready to present</h2>
            <p className="mt-2 text-muted-foreground">
              The portal ships with realistic department data. Sign in with either role and demonstrate the full
              flow — notices, events, resources, support tickets and the admin console.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card size="sm" className="bg-secondary/50">
              <CardContent className="p-4">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Student</p>
                <p className="mt-1 font-medium">aman.cse084@mrsptu.ac.in</p>
                <p className="font-mono text-xs text-muted-foreground">password: student123</p>
              </CardContent>
            </Card>
            <Card size="sm" className="bg-secondary/50">
              <CardContent className="p-4">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Administrator</p>
                <p className="mt-1 font-medium">hod.cse@mrsptu.ac.in</p>
                <p className="font-mono text-xs text-muted-foreground">password: admin123</p>
              </CardContent>
            </Card>
            <Link
              to="/login"
              data-testid="landing-go-to-login-button"
              className={buttonVariants({ variant: "default", size: "lg" }) + " sm:col-span-2"}
            >
              <LayoutDashboard className="size-4" /> Open the portal
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/70 bg-muted/50">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p className="flex items-center gap-2">
            <GraduationCap className="size-4" /> CampusConnect — Department of CSE, MRSPTU Bathinda
          </p>
          <p>Built as a B.Tech CSE demonstration project.</p>
        </div>
      </footer>
    </div>
  );
}
