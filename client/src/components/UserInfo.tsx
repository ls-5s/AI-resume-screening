import { useState, useEffect, useRef } from "react";
import { LogOut, ChevronDown, Settings } from "lucide-react";
import { useLoginStore } from "../store/Login";
import { getProfile } from "../api/profile";
import { useNavigate } from "react-router-dom";

interface UserInfoProps {
  username?: string;
  /** 侧边栏收起时仅显示头像，菜单在右侧弹出 */
  compact?: boolean;
}

export function UserInfo({ username: propsUsername, compact = false }: UserInfoProps) {
  const logout = useLoginStore((state) => state.logout);
  const user = useLoginStore((state) => state.user);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const displayUsername = propsUsername || user?.username || "用户";
  const displayAvatar = avatar || user?.avatar || null;

  const handleLogout = () => {
    logout();
    window.location.href = "/";
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
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={compact ? displayUsername : undefined}
        aria-label={compact ? `用户菜单：${displayUsername}` : undefined}
        aria-expanded={isOpen ? "true" : "false"}
        aria-haspopup="menu"
        className={`
          flex items-center w-full bg-transparent border-none rounded-[10px] cursor-pointer
          hover:bg-[#f3f4f6] transition-all duration-150
          ${compact ? "justify-center px-2 py-2" : "gap-2.5 px-3 py-2 text-left"}
        `}
      >
        {/* Avatar with gradient ring */}
        <div className="w-9 h-9 rounded-full p-[2px] bg-linear-to-br from-[#667eea] to-[#764ba2] shrink-0">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
            {displayAvatar ? (
              <img src={displayAvatar} alt="" aria-hidden className="w-full h-full object-cover" />
            ) : (
              <span className="text-[13px] font-semibold bg-linear-to-br from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                {displayUsername.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {!compact && (
          <>
            {/* Name + role */}
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] font-semibold text-[#1a1a2e] truncate leading-tight">
                {displayUsername}
              </span>
              <span className="text-[11px] text-[#9ca3af] leading-tight">管理员</span>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-[#9ca3af] shrink-0 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown — 展开：在底部上方；收起：在右侧 */}
      {isOpen && (
        <div
          className={`
            absolute z-50 bg-white border border-black/5 rounded-xl
            shadow-[0_8px_24px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] p-1 min-w-44
            ${compact ? "left-full bottom-0 ml-2" : "left-2 right-2 bottom-full mb-1"}
          `}
        >
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => { setIsOpen(false); navigate("/app/settings"); }}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 border-none bg-transparent rounded-lg text-[13px] font-medium text-[#374151] cursor-pointer hover:bg-[#f3f4f6] transition-all duration-150"
            >
              <Settings className="w-3.5 h-3.5 text-[#9ca3af]" />
              账号设置
            </button>
          </div>
          <div className="h-px bg-black/5 my-1" />
          <div className="flex flex-col gap-0.5">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 border-none bg-transparent rounded-lg text-[13px] font-medium text-red-500 cursor-pointer hover:bg-red-50 hover:text-red-600 transition-all duration-150"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
