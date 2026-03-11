import { Link, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Briefcase,
  Mail
} from "lucide-react";
import { useLoginStore } from "../store/Login";
import { UserInfo } from "../components/UserInfo";

/** 菜单项类型 */
interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

/** 菜单配置 */
const menuItems: MenuItem[] = [
  { path: "/app", label: "仪表盘", icon: <LayoutDashboard className="w-5 h-5" /> },
  { path: "/app/resumes", label: "简历管理", icon: <FileText className="w-5 h-5" /> },
  { path: "/app/candidates", label: "候选人", icon: <Users className="w-5 h-5" /> },
  { path: "/app/aiscreening", label: "AI简历筛选", icon: <Briefcase className="w-5 h-5" /> },
  { path: "/app/emails", label: "邮件群发", icon: <Mail className="w-5 h-5" /> },
  { path: "/app/settings", label: "设置", icon: <Settings className="w-5 h-5" /> },
];

export default function Layout() {
  const location = useLocation();
  const { user } = useLoginStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部横向导航栏 */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:px-6">
          <Link to="/app" className="flex items-center gap-2 justify-self-start shrink-0 whitespace-nowrap">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 whitespace-nowrap">
              AI 简历筛选
            </span>
          </Link>

          <nav className="justify-self-center max-w-full">
            <div className="flex items-center gap-1 overflow-x-auto">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap
                      ${isActive 
                        ? "bg-slate-900 text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                      }
                    `}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="justify-self-end">
            <UserInfo username={user?.username} />
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="pt-16">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
