import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { register as registerApi } from "../../api/login";
import toast from "../../utils/toast";

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      form.setError("confirmPassword", { message: "两次密码输入不一致" });
      return;
    }
    setIsLoading(true);
    try {
      await registerApi({
        username: data.username,
        email: data.email,
        password: data.password,
      });
      toast.success("注册成功，请登录！");
      onSuccess?.();
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "注册失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form-stack">
      <div>
        <label className="auth-label" htmlFor="reg-username">
          用户名 <span className="text-red-500">*</span>
        </label>
        <input
          id="reg-username"
          type="text"
          autoComplete="username"
          placeholder="请输入用户名"
          {...form.register("username", {
            required: "请输入用户名",
            minLength: { value: 2, message: "用户名至少2位" },
          })}
          className="auth-input-field input-field"
        />
        {form.formState.errors.username && (
          <p className="err-text">{form.formState.errors.username.message}</p>
        )}
      </div>

      <div>
        <label className="auth-label" htmlFor="reg-email">
          邮箱 <span className="text-red-500">*</span>
        </label>
        <input
          id="reg-email"
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
        <label className="auth-label" htmlFor="reg-password">
          密码 <span className="text-red-500">*</span>
        </label>
        <div className="auth-relative">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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

      <div>
        <label className="auth-label" htmlFor="reg-confirm">
          确认密码 <span className="text-red-500">*</span>
        </label>
        <div className="auth-relative">
          <input
            id="reg-confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="再次输入密码"
            {...form.register("confirmPassword", { required: "请再次输入密码" })}
            className="auth-input-field auth-input-with-icon input-field"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
            className="auth-eye-btn"
            aria-label={showConfirm ? "隐藏确认密码" : "显示确认密码"}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="err-text">{form.formState.errors.confirmPassword.message}</p>
        )}
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
          "注册"
        )}
      </button>
    </form>
  );
}
