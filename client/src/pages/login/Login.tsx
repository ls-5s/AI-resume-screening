import { useState, useEffect } from "react";
import { useLoginStore } from "../../store/Login";
import toast from "../../utils/toast";
import { LoginForm, RegisterForm } from "../../components/login";

const FEATURES = [
  "智能解析简历，快速提取关键信息",
  "多维度匹配岗位，提升筛选精准度",
  "批量处理候选人，节省招聘时间",
  "数据安全可控，助力合规招聘流程",
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [key, setKey] = useState(0);
  const { token } = useLoginStore();

  useEffect(() => {
    if (token) window.location.href = "/app";
  }, [token]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("redirect") === "unauthorized") {
      toast.error("请先登录后再访问");
    }
  }, []);

  const switchTab = (val: boolean) => {
    setIsLogin(val);
    setKey((k) => k + 1);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <aside className="auth-aside">
          <div className="auth-aside-bg" aria-hidden />

          <div className="auth-aside-inner">
            <div className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <svg
                  width={20}
                  height={20}
                  className="text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-base font-semibold tracking-wide">AI Resume Screening</span>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-[1.75rem] lg:leading-snug">
                欢迎来到
                <br />
                AI 简历筛选
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-[15px]">
                用智能工具赋能招聘，让每一份简历都被认真对待
              </p>
            </div>

            <ul className="space-y-3 text-sm text-white/80 sm:text-[15px]">
              {FEATURES.map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="auth-aside-footer">
            © {new Date().getFullYear()} AI Resume Screening
          </p>
        </aside>

        <div className="auth-form-panel">
          <header className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
              {isLogin ? "账号登录" : "账号注册"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isLogin
                ? "登录后即可使用简历智能筛选与匹配能力"
                : "注册账户，开始使用 AI 简历筛选"}
            </p>
          </header>

          <div className="auth-tabs">
            <button
              type="button"
              onClick={() => switchTab(true)}
              className={`auth-tab ${isLogin ? "auth-tab-active" : ""}`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => switchTab(false)}
              className={`auth-tab ${!isLogin ? "auth-tab-active" : ""}`}
            >
              注册
            </button>
          </div>

          <div key={key} className="form-container">
            {isLogin ? <LoginForm /> : <RegisterForm onSuccess={() => switchTab(true)} />}
          </div>
        </div>
      </div>
    </div>
  );
}
