import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, Settings, Briefcase, Mail } from "lucide-react";
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

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col bg-white border-r border-black/5 z-40">
        {/* Brand */}
        <div className="px-5 py-[22px] border-b border-black/5">
          <Link to="/app" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 rounded-[10px] bg-linear-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(102,126,234,0.35)] shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.9"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-[#1a1a2e] tracking-tight">
              简历筛选
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/app" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] no-underline text-[14px] font-medium
                  transition-all duration-150 group
                  ${
                    isActive
                      ? "bg-linear-to-r from-[rgba(102,126,234,0.1)] to-[rgba(118,75,162,0.1)] text-[#667eea]"
                      : "text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#374151]"
                  }
                `}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0 transition-transform duration-150 group-hover:scale-105" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-black/5">
          <UserInfo username={user?.username} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-60 flex-1 min-h-screen flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
