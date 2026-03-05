import { useState } from "react";
import { Loader2 } from "lucide-react";

// 模拟 API 登录
const mockLogin = async (email: string, password: string) => {
  return new Promise<{ token: string; user: { id: string; username: string; email: string } }>((resolve, reject) => {
    setTimeout(() => {
      if (email && password) {
        resolve({
          token: "mock-token-12345",
          user: { id: "1", username: email.split("@")[0], email },
        });
      } else {
        reject(new Error("邮箱或密码不能为空"));
      }
    }, 1000);
  });
};

// 模拟 API 注册
const mockRegister = async (username: string, email: string, password: string) => {
  return new Promise<{ token: string; user: { id: string; username: string; email: string } }>((resolve, reject) => {
    setTimeout(() => {
      if (username && email && password) {
        resolve({
          token: "mock-token-12345",
          user: { id: "1", username, email },
        });
      } else {
        reject(new Error("所有字段都不能为空"));
      }
    }, 1000);
  });
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        const res = await mockLogin(email, password);
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        console.log("登录成功:", res);
      } else {
        const res = await mockRegister(username, email, password);
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        console.log("注册成功:", res);
        alert("注册成功，请登录！");
        setIsLogin(true);
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "请求失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧装饰 */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12">
        <div>
          <h2 className="text-2xl font-semibold text-white">AI 简历筛选</h2>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight">
            智能筛选人才<br />提升招聘效率
          </h1>
          <p className="mt-4 text-slate-400 text-lg">
            利用 AI 技术自动分析和匹配候选人，让招聘更智能、更高效
          </p>
        </div>
        <p className="text-slate-500 text-sm">© 2026 AI Resume Screening</p>
      </div>

      {/* 右侧表单 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* 标题 */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {isLogin ? "欢迎回来" : "创建账户"}
            </h2>
            <p className="mt-2 text-gray-500">
              {isLogin ? "请登录您的账户" : "开始使用 AI 简历筛选"}
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 登录：邮箱 / 注册：用户名 */}
            {isLogin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                <input
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                />
              </div>
            )}

            {/* 邮箱 (仅注册) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                />
              </div>
            )}

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </span>
              ) : (
                isLogin ? "登录" : "注册"
              )}
            </button>
          </form>

          {/* 切换 */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? (
              <>
                还没有账户?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-slate-900 font-medium hover:underline"
                >
                  注册
                </button>
              </>
            ) : (
              <>
                已有账户?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-slate-900 font-medium hover:underline"
                >
                  登录
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
