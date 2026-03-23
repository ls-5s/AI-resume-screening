import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { login } from "../../api/login";
import { useLoginStore } from "../../store/Login";
import toast from "../../utils/toast";

const REMEMBER_KEY = "auth_remember_email";
const EMAIL_KEY = "auth_saved_email";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const form = useForm<LoginFormData>({ defaultValues: { email: "", password: "" } });
  const { reset } = form;
  const { login: storeLogin } = useLoginStore();

  useEffect(() => {
    const savedRemember = localStorage.getItem(REMEMBER_KEY) === "1";
    const savedEmail = localStorage.getItem(EMAIL_KEY) ?? "";
    setRemember(savedRemember);
    if (savedRemember && savedEmail) reset({ email: savedEmail, password: "" });
  }, [reset]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      storeLogin(await login(data));
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, "1");
        localStorage.setItem(EMAIL_KEY, data.email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(EMAIL_KEY);
      }
      toast.success("登录成功");
      window.location.href = "/app";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form-stack">
      <div>
        <label className="auth-label" htmlFor="login-email">
          邮箱 <span className="text-red-500">*</span>
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="请输入邮箱"
          {...form.register("email", {
            required: "请输入邮箱",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "请输入有效的邮箱地址" },
          })}
          className="auth-input-field input-field"
        />
        {form.formState.errors.email && (
          <p className="err-text">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="auth-label" htmlFor="login-password">
          密码 <span className="text-red-500">*</span>
        </label>
        <div className="auth-relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="请输入密码"
            {...form.register("password", {
              required: "请输入密码",
              minLength: { value: 6, message: "密码至少6位" },
            })}
            className="auth-input-field auth-input-with-icon input-field"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="auth-eye-btn"
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="err-text">{form.formState.errors.password.message}</p>
        )}
      </div>

      <div className="auth-row-between">
        <label className="auth-checkbox-label">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="auth-checkbox checkbox-custom"
          />
          记住邮箱
        </label>
        <button
          type="button"
          className="auth-link-btn"
          onClick={() => toast.info("请联系管理员重置密码")}
        >
          忘记密码?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="submit-btn w-full rounded-lg py-3 text-sm font-medium text-white disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            处理中...
          </span>
        ) : (
          "登录"
        )}
      </button>
    </form>
  );
}
