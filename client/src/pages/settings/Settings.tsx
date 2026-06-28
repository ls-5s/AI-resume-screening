/**
 * 设置页 (路由: /app/settings)
 * 标签页：个人资料 / AI 配置 / 邮箱配置 / 团队管理
 */

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Bot, Mail, User, Users } from "lucide-react";
import { EmailConfigList } from "../../components/setting/email";
import { ProfileSettings } from "../../components/setting/profile";
import { AiSettings } from "../../components/setting/ai";
import { TeamSettings } from "../../components/setting/team";

export default function Settings() {
  // 四个设置标签页的联合类型，URL 参数 ?tab=xxx 的值必须是其中之一
  type TabKey = "profile" | "ai" | "email" | "team";

  // 通过 URL 查询参数 ?tab=xxx 控制当前激活的标签页
  // 优点：刷新页面保持标签状态，支持浏览器前进/后退
  const [searchParams, setSearchParams] = useSearchParams();

  // 标签页配置：用 useMemo 缓存，避免每次渲染重建数组
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
        {
          key: "team" as const,
          label: "成员管理",
          sub: "团队与权限",
          icon: Users,
        },
      ] as const,
    [],
  );

  // 从 URL 读取当前标签，非法值回退为 "profile"
  const tabParam = searchParams.get("tab");
  const activeTab: TabKey =
    tabParam === "profile" || tabParam === "ai" || tabParam === "email" || tabParam === "team"
      ? tabParam
      : "profile";

  return (
    <div className="relative min-h-full">
      {/* 顶部弱渐变光晕背景，纯装饰，不响应鼠标事件 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.06),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* === 页面标题 + 标签切换按钮 === */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {/* 左侧标题区 */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-(--app-text-muted)">
              Settings
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-(--app-text-primary) sm:text-[1.75rem]">
              设置中心
            </h1>
            <p className="mt-1 max-w-[720px] text-sm text-(--app-text-secondary)">
              统一管理你的个人资料、AI 模型配置以及邮件发送所需的邮箱参数。
            </p>
          </div>

          {/* 右侧标签切换按钮组 — 用圆角容器包裹，类似 iOS Segmented Control */}
          <div className="w-full sm:w-auto">
            <div className="inline-flex w-full flex-wrap gap-1.5 rounded-2xl border border-(--app-border) bg-(--app-surface-raised) p-1.5 sm:w-auto sm:flex-nowrap">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  // 点击更新 URL 参数 ?tab=xxx，触发标签切换
                  onClick={() => setSearchParams({ tab: t.key })}
                  // 无障碍：标记当前激活的标签页
                  aria-current={isActive ? "page" : undefined}
                  className={`group inline-flex min-w-[140px] items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--app-primary)/25 ${
                    isActive
                      // 激活态：轻微上浮 + 品牌色边框 + 投影 + 内发光环
                      ? "-translate-y-px border-(--app-primary)/20 bg-(--app-surface) shadow-[0_10px_24px_-16px_var(--app-primary,#0ea5e9)]/30 ring-1 ring-(--app-primary)/20"
                      // 非激活态：透明背景，hover 时出现边框和背景
                      : "border-transparent bg-transparent hover:border-(--app-border) hover:bg-(--app-surface)/80 hover:shadow-[0_6px_16px_-14px_rgba(15,23,42,0.35)] active:scale-[0.99]"
                  }`}
                  title={t.sub}
                >
                  {/* 图标区域：激活时渐变背景 + 白色图标 */}
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? "bg-linear-to-br from-(--app-primary) to-(--app-accent) text-white shadow-sm"
                        : "bg-(--app-surface-raised) text-(--app-text-muted) group-hover:bg-(--app-border)"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  {/* 文字区域：标签名 + 副标题 */}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-(--app-text-primary)">
                      {t.label}
                    </span>
                    <span
                      className={`block truncate text-[11px] ${
                        // 激活时用品牌色，否则灰色，hover 时加深
                        isActive ? "text-(--app-primary)" : "text-(--app-text-muted) group-hover:text-(--app-text-secondary)"
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

        {/* === 内容区：只渲染当前激活的标签页组件，避免同时挂载 4 个子组件 === */}
        {activeTab === "profile" && <ProfileSettings />}
        {activeTab === "ai" && <AiSettings />}
        {activeTab === "email" && <EmailConfigList />}
        {activeTab === "team" && <TeamSettings />}
      </div>
    </div>
  );
}
