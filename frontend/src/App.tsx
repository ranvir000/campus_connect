import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";

const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Academics = lazy(() => import("@/pages/Academics"));
const Notices = lazy(() => import("@/pages/Notices"));
const Events = lazy(() => import("@/pages/Events"));
const Resources = lazy(() => import("@/pages/Resources"));
const Support = lazy(() => import("@/pages/Support"));
const Profile = lazy(() => import("@/pages/Profile"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminNotices = lazy(() => import("@/pages/AdminNotices"));
const AdminEvents = lazy(() => import("@/pages/AdminEvents"));
const AdminResources = lazy(() => import("@/pages/AdminResources"));
const AdminSupport = lazy(() => import("@/pages/AdminSupport"));

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={<div className="grid min-h-svh place-items-center text-sm text-muted-foreground">Loading CampusConnect…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/academics" element={<RequireAuth><Academics /></RequireAuth>} />
        <Route path="/notices" element={<RequireAuth><Notices /></RequireAuth>} />
        <Route path="/events" element={<RequireAuth><Events /></RequireAuth>} />
        <Route path="/resources" element={<RequireAuth><Resources /></RequireAuth>} />
        <Route path="/support" element={<RequireAuth><Support /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth admin><AdminDashboard /></RequireAuth>} />
        <Route path="/admin/notices" element={<RequireAuth admin><AdminNotices /></RequireAuth>} />
        <Route path="/admin/events" element={<RequireAuth admin><AdminEvents /></RequireAuth>} />
        <Route path="/admin/resources" element={<RequireAuth admin><AdminResources /></RequireAuth>} />
        <Route path="/admin/support" element={<RequireAuth admin><AdminSupport /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster richColors />
    </MotionConfig>
  );
}
