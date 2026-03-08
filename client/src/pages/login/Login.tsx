import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { login, register } from "../../api/login";
import { useLoginStore } from "../../store/Login";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login: storeLogin } = useLoginStore();

  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  const onLogin = async (data: LoginForm) => {
    setError("");
    setIsLoading(true);
    try {
      const res = await login(data);
      storeLogin(res);
      console.log("登录成功:", res);
      // 跳转首页
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setError("");
    if (data.password !== data.confirmPassword) {
      setError("两次密码输入不一致");
      return;
    }
    setIsLoading(true);
        try {
      await register({
        username: data.username,
        email: data.email,
        password: data.password,
            });
      alert("注册成功，请登录！");
      setIsLogin(true);
      registerForm.reset();
        } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
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

          {isLogin ? (
            /* 登录表单 */
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  {...loginForm.register("email", { 
                    required: "请输入邮箱",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "请输入有效的邮箱地址"
                    }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register("password", { 
                    required: "请输入密码",
                    minLength: { value: 6, message: "密码至少6位" }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

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
                  "登录"
                )}
              </button>
            </form>
          ) : (
            /* 注册表单 */
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
            <input
                type="text"
                placeholder="请输入用户名"
                  {...registerForm.register("username", { 
                    required: "请输入用户名",
                    minLength: { value: 2, message: "用户名至少2位" }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                />
                {registerForm.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-500">{registerForm.formState.errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  {...registerForm.register("email", { 
                    required: "请输入邮箱",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "请输入有效的邮箱地址"
                    }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <input
                  type="password"
                  placeholder="至少6位"
                  {...registerForm.register("password", { 
                    required: "请输入密码",
                    minLength: { value: 6, message: "密码至少6位" }
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
            />
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                )}
        </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
            <input
                type="password"
                  placeholder="再次输入密码"
                  {...registerForm.register("confirmPassword", { 
                    required: "请再次输入密码"
                  })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-colors"
            />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
        </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

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
                  "注册"
                )}
        </button>
    </form>
          )}

          {/* 切换 */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? (
              <>
                还没有账户?{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(""); loginForm.reset(); }}
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
                  onClick={() => { setIsLogin(true); setError(""); registerForm.reset(); }}
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
