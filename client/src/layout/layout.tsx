import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Briefcase,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useLoginStore } from "../store/Login";
import { UserInfo } from "../components/UserInfo";

const navItems = [
  { path: "/app", label: "仪表盘", icon: LayoutDashboard },
  { path: "/app/resumes", label: "简历管理", icon: FileText },
  { path: "/app/aiscreening", label: "AI 筛选", icon: Briefcase },
  { path: "/app/emails", label: "邮件群发", icon: Mail },
  { path: "/app/settings", label: "设置", icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const { user } = useLoginStore();

  const [expanded, setExpanded] = useState(
    () => localStorage.getItem("sidebar-expanded") !== "false"
  );

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 flex flex-col bg-white border-r border-black/5 z-40
          transition-[width] duration-200 ease-out overflow-hidden
          ${expanded ? "w-60" : "w-[72px]"}
        `}
      >
        {/* 顶栏：品牌 + 侧栏开关 */}
        <div className="shrink-0 border-b border-black/5">
          {expanded ? (
            <div className="flex items-center gap-1 pl-4 pr-2 py-[18px]">
              <Link
                to="/app"
                className="flex min-w-0 flex-1 items-center gap-3 no-underline"
                title="简历筛选"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-linear-to-br from-[#667eea] to-[#764ba2] text-white shadow-[0_2px_8px_rgba(102,126,234,0.35)]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.9"/>
                    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
                  </svg>
                </div>
                <span className="truncate text-[15px] font-semibold tracking-tight text-[#1a1a2e]">
                  简历筛选
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                title="收起侧栏"
                aria-label="收起侧边栏"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#667eea]/25 focus-visible:ring-offset-2"
              >
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-3 py-4">
              <Link to="/app" className="flex shrink-0 no-underline" title="简历筛选">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-linear-to-br from-[#667eea] to-[#764ba2] text-white shadow-[0_2px_8px_rgba(102,126,234,0.35)]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.9"/>
                    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
                  </svg>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                title="展开侧栏"
                aria-label="展开侧边栏"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#667eea]/25 focus-visible:ring-offset-2"
              >
                <PanelLeftOpen className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto min-h-0">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/app" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                title={expanded ? undefined : item.label}
                className={`
                  flex items-center rounded-[10px] no-underline text-[14px] font-medium
                  transition-all duration-150 group
                  ${expanded ? "gap-3 px-3.5 py-2.5" : "justify-center px-2 py-2.5"}
                  ${
                    isActive
                      ? "bg-linear-to-r from-[rgba(102,126,234,0.1)] to-[rgba(118,75,162,0.1)] text-[#667eea]"
                      : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#374151]"
                  }
                `}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover:scale-105" />
                {expanded && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className={`border-t border-black/5 shrink-0 ${expanded ? "px-3 py-3" : "px-2 py-3"}`}>
          <UserInfo username={user?.username} compact={!expanded} />
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
          flex-1 min-h-screen flex flex-col
          transition-[margin] duration-200 ease-out
          ${expanded ? "ml-60" : "ml-[72px]"}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}
