import { useState } from "react";
import { EmailTemplateList } from "../../components/emails/EmailTemplateList";
import { EmailSender } from "../../components/emails/EmailSender";
import { Send, Layers, Zap, Clock } from "lucide-react";

export default function EmailTemplates() {
  const [activeTab, setActiveTab] = useState<"templates" | "send">("templates");
  const [initialTemplateId, setInitialTemplateId] = useState<number | null>(
    null,
  );
  const [totalTemplates, setTotalTemplates] = useState(0);

  const handleUseTemplate = (template: { id: number }) => {
    setInitialTemplateId(template.id);
    setActiveTab("send");
  };

  const tabs = [
    {
      id: "templates" as const,
      label: "模板管理",
      sub: "创建与管理邮件模板",
      icon: Layers,
      accent: "from-sky-500 to-blue-500",
      ring: "ring-sky-500/25",
      iconColor: "text-sky-600",
      iconBg: "bg-sky-500/12",
    },
    {
      id: "send" as const,
      label: "发送邮件",
      sub: "选择模板与收件人",
      icon: Send,
      accent: "from-blue-500 to-sky-500",
      ring: "ring-blue-500/25",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-500/12",
    },
  ];

  return (
    <div className="relative min-h-full">
      {/* 页面弱氛围背景 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.07),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1360px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        {/* 页面头部：标题在左，分段控件靠右 */}
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Email Hub
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
              邮件管理
            </h1>
          </div>

          <div className="flex shrink-0 justify-end">
            {/* Tab 切换：分段控件贴页面最右侧 */}
            <div
              role="group"
              aria-label="邮件功能切换"
              className="flex w-full max-w-md items-stretch gap-0 overflow-hidden rounded-2xl border border-zinc-200/70 bg-zinc-100/60 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] sm:ml-auto sm:w-auto sm:max-w-none"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-label={
                      isActive ? `${tab.label}（当前）` : `切换到${tab.label}`
                    }
                    className={`
                      relative flex flex-1 items-center justify-center gap-2.5 rounded-xl px-4 py-2.5
                      text-sm font-medium transition-all duration-200 sm:flex-none sm:justify-start
                      ${
                        isActive
                          ? `bg-white text-zinc-900 shadow-[0_1px_3px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-zinc-950/4`
                          : "text-zinc-500 hover:text-zinc-700"
                      }
                    `}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive ? tab.iconBg : "bg-zinc-200/60"
                      }`}
                    >
                      <Icon
                        className={`h-[14px] w-[14px] ${isActive ? tab.iconColor : "text-zinc-400"}`}
                        strokeWidth={1.75}
                      />
                    </span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* 发送页统计 Strip（仅发送页显示） */}
        {activeTab === "send" && (
          <section
            aria-label="邮件统计"
            className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              {
                icon: Layers,
                desc: "可用模板",
                value: totalTemplates,
                accent: "text-sky-600",
                iconBg: "bg-sky-500/12",
                bar: "border-t-sky-500/90",
              },
              {
                icon: Send,
                desc: "已发送",
                value: 0,
                accent: "text-sky-600",
                iconBg: "bg-sky-500/12",
                bar: "border-t-sky-500/90",
              },
              {
                icon: Clock,
                desc: "今日发送",
                value: 0,
                accent: "text-amber-600",
                iconBg: "bg-amber-500/12",
                bar: "border-t-amber-500/90",
              },
              {
                icon: Zap,
                desc: "本月发送",
                value: 0,
                accent: "text-emerald-600",
                iconBg: "bg-emerald-500/12",
                bar: "border-t-emerald-500/90",
              },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.desc}
                  className={`
                    group relative flex flex-col rounded-2xl border border-zinc-200/80 bg-white
                    px-5 py-5 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.08),0_4px_16px_-4px_rgba(15,23,42,0.06)]
                    ring-1 ring-zinc-950/[0.03] transition-all duration-300 ease-out
                    hover:-translate-y-0.5 hover:border-zinc-200 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]
                    sm:px-6 sm:py-6
                    ${m.bar} border-t-[3px]
                  `}
                >
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                      {m.desc}
                    </span>
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.iconBg} ${m.accent} transition-transform duration-300 group-hover:scale-105`}
                    >
                      <Icon
                        className="h-[18px] w-[18px]"
                        strokeWidth={1.75}
                      />
                    </div>
                  </div>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 lg:text-[2rem]">
                    {m.value.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </section>
        )}

        {/* 内容区域 */}
        <div className="min-h-0">
          {activeTab === "templates" && (
            <EmailTemplateList onUseTemplate={handleUseTemplate} />
          )}
          {activeTab === "send" && (
            <EmailSender
              initialTemplateId={initialTemplateId}
              onInitialTemplateApplied={() => setInitialTemplateId(null)}
              onTemplateCount={(count) => setTotalTemplates(count)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
