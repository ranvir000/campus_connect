import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { useSession } from "@/lib/session";
import type { ReactNode } from "react";
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
const SiteAdminAccounts = lazy(() => import("@/pages/SiteAdminAccounts"));
function Landing() {
 const { data, isLoading } = useSession();
 if (isLoading) return <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">Loading CampusConnect…</div>;
 if (data?.user) return <Navigate to={data.user.role === "site_admin" ? "/site-admin" : data.user.role === "faculty" ? "/faculty" : "/dashboard"} replace />;
 return <Home />;
}
const faculty=(node:ReactNode)=><RequireAuth roles={["faculty"]}>{node}</RequireAuth>;
const student=(node:ReactNode)=><RequireAuth roles={["student"]}>{node}</RequireAuth>;
const siteAdmin=(node:ReactNode)=><RequireAuth roles={["site_admin"]}>{node}</RequireAuth>;
export default function App() { return <MotionConfig reducedMotion="user"><Suspense fallback={<div className="grid min-h-svh place-items-center text-sm text-muted-foreground">Loading CampusConnect…</div>}><Routes>
<Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/>
<Route path="/dashboard" element={student(<Dashboard/>)} /><Route path="/academics" element={student(<Academics/>)} /><Route path="/notices" element={student(<Notices/>)} /><Route path="/events" element={student(<Events/>)} /><Route path="/resources" element={student(<Resources/>)} /><Route path="/support" element={student(<Support/>)} /><Route path="/profile" element={<RequireAuth roles={["student","faculty"]}><Profile/></RequireAuth>} />
<Route path="/faculty" element={faculty(<AdminDashboard/>)} /><Route path="/faculty/notices" element={faculty(<AdminNotices/>)} /><Route path="/faculty/events" element={faculty(<AdminEvents/>)} /><Route path="/faculty/resources" element={faculty(<AdminResources/>)} /><Route path="/faculty/support" element={faculty(<AdminSupport/>)} />
<Route path="/site-admin" element={siteAdmin(<SiteAdminAccounts/>)} />
<Route path="/admin" element={<Navigate to="/faculty" replace/>}/><Route path="/admin/*" element={<LegacyFacultyRedirect/>}/><Route path="*" element={<Navigate to="/" replace/>}/>
</Routes></Suspense><Toaster richColors/></MotionConfig> }
function LegacyFacultyRedirect(){const path=window.location.pathname.replace(/^\/admin/,"/faculty");return <Navigate to={path} replace/>;}
