import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Bot, Mail, User } from "lucide-react";
import { EmailConfigList } from "../../components/setting/email";
import { ProfileSettings } from "../../components/setting/profile";
import { AiSettings } from "../../components/setting/ai";

export default function Settings() {
  type TabKey = "profile" | "ai" | "email";
  const [searchParams, setSearchParams] = useSearchParams();

  const tabs = useMemo(
    () =>
      [
        {
          key: "profile" as const,
          label: "个人信息",
          sub: "账号与头像",
          icon: User,
        },
        {
          key: "ai" as const,
          label: "AI 配置",
          sub: "模型与提示词",
          icon: Bot,
        },
        {
          key: "email" as const,
          label: "邮箱配置",
          sub: "IMAP / SMTP",
          icon: Mail,
        },
      ] as const,
    [],
  );

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey =
    tabParam === "profile" || tabParam === "ai" || tabParam === "email"
      ? tabParam
      : "profile";

  return (
    <div className="relative min-h-full">
      {/* 页面弱氛围背景 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.06),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Settings
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
              设置中心
            </h1>
            <p className="mt-1 max-w-[720px] text-sm text-zinc-500">
              统一管理你的个人资料、AI 模型配置以及邮件发送所需的邮箱参数。
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <div className="inline-flex w-full flex-wrap gap-1.5 rounded-2xl border border-zinc-200/80 bg-zinc-50/75 p-1.5 sm:w-auto sm:flex-nowrap">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSearchParams({ tab: t.key })}
                  aria-current={isActive ? "page" : undefined}
                  className={`group inline-flex min-w-[140px] items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60 ${
                    isActive
                      ? "-translate-y-px border-sky-200/90 bg-white shadow-[0_10px_24px_-16px_rgba(14,165,233,0.55)] ring-1 ring-sky-300/40"
                      : "border-transparent bg-transparent hover:border-zinc-200/80 hover:bg-white/95 hover:shadow-[0_6px_16px_-14px_rgba(15,23,42,0.35)] active:scale-[0.99]"
                  }`}
                  title={t.sub}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? "bg-linear-to-br from-sky-600 to-blue-600 text-white shadow-sm"
                        : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-zinc-900">
                      {t.label}
                    </span>
                    <span
                      className={`block truncate text-[11px] ${
                        isActive ? "text-sky-600" : "text-zinc-400 group-hover:text-zinc-500"
                      }`}
                    >
                      {t.sub}
                    </span>
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </header>

        {/* 内容：仅渲染当前激活模块，减少视觉噪声 */}
        {activeTab === "profile" && <ProfileSettings />}
        {activeTab === "ai" && <AiSettings />}
        {activeTab === "email" && <EmailConfigList />}
      </div>
    </div>
  );
}
