import { Link, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Menu,
  X,
  Briefcase,
  Mail
} from "lucide-react";
import { useState } from "react";
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
  { path: "/app/jobs", label: "职位管理", icon: <Briefcase className="w-5 h-5" /> },
  { path: "/app/emails", label: "邮件群发", icon: <Mail className="w-5 h-5" /> },
  { path: "/app/settings", label: "设置", icon: <Settings className="w-5 h-5" /> },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useLoginStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* 左侧 - Logo 和汉堡菜单 */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/app" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 hidden sm:block">
                AI 简历筛选
              </span>
            </Link>
          </div>

          {/* 右侧 - 用户信息 */}
          <UserInfo username={user?.username} />
        </div>
      </header>

      {/* 左侧边栏 */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-300 z-30
          lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
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
        </nav>
      </aside>

      {/* 遮罩层 - 移动端侧边栏打开时显示 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主内容区域 */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
