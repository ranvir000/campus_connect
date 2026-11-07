import { Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Academics from "@/pages/Academics";
import Notices from "@/pages/Notices";
import Events from "@/pages/Events";
import Resources from "@/pages/Resources";
import Support from "@/pages/Support";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminNotices from "@/pages/AdminNotices";
import AdminEvents from "@/pages/AdminEvents";
import AdminResources from "@/pages/AdminResources";
import AdminSupport from "@/pages/AdminSupport";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
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
      <Toaster richColors />
    </MotionConfig>
  );
}
