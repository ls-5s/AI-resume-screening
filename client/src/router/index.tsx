import { createBrowserRouter, redirect } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "../layout/layout";
import NotFound from "../pages/NotFound";
import { PageLoader } from "../components/PageLoader";
import { useLoginStore } from "../store/Login";

// 懒加载页面组件
const Login = lazy(() => import("../pages/login/Login"));
const Dashboard = lazy(() => import("../pages/dashboard/Dashboard"));
const Resumes = lazy(() => import("../pages/resumes/Resumes"));
const Candidates = lazy(() => import("../pages/candidates/Candidates"));
const Jobs = lazy(() => import("../pages/jobs/Jobs"));
const Settings = lazy(() => import("../pages/settings/Settings"));
const EmailTemplates = lazy(() => import("../pages/emails/EmailTemplates"));

// 路由守卫：检查是否已登录
const requireAuth = () => {
  const token = useLoginStore.getState().token;
  if (!token) {
    throw redirect("/?redirect=unauthorized");
  }
  return null;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<PageLoader />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/app",
    loader: requireAuth,
    element: <Layout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: "resumes",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Resumes />
          </Suspense>
        ),
      },
      {
        path: "candidates",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Candidates />
          </Suspense>
        ),
      },
      {
        path: "jobs",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Jobs />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        ),
      },
      {
        path: "emails",
        element: (
          <Suspense fallback={<PageLoader />}>
            <EmailTemplates />
          </Suspense>
        ),
      },
    ],
    errorElement: <NotFound />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
