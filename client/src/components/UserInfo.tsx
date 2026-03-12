import { useState, useEffect, useRef } from "react";
import { LogOut, ChevronDown, Settings } from "lucide-react";
import { useLoginStore } from "../store/Login";
import { getProfile } from "../api/profile";
import { useNavigate } from "react-router-dom";

interface UserInfoProps {
  username?: string;
}

export function UserInfo({ username: propsUsername }: UserInfoProps) {
  const logout = useLoginStore((state) => state.logout);
  const user = useLoginStore((state) => state.user);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取最新头像信息（只获取头像，其他信息从 store 获取）
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setAvatar(data.avatar);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  // 优先使用 props传入的用户名，其次使用 store 中的用户名
  const displayUsername = propsUsername || user?.username || "用户";
  const displayAvatar = avatar || user?.avatar || null;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const handleGoToSettings = () => {
    setIsOpen(false);
    navigate("/settings");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-4" ref={dropdownRef}>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex items-center gap-2 hover:bg-gray-100/80 rounded-full px-1.5 py-1.5 transition-all duration-200 group"
        >
          <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={displayUsername}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-white">
                {displayUsername.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
            {displayUsername}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100/50 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="py-1.5">
              <button
                onClick={handleGoToSettings}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                设置
              </button>
            </div>

            <div className="border-t border-gray-100 mt-1.5 pt-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
        aria-label="退出登录"
        className="flex md:hidden items-center justify-center w-9 h-9 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
