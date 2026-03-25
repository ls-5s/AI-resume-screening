import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Type,
  Layers,
  LayoutGrid,
  Check,
  Star,
  Heart,
  Zap,
  Shield,
  Activity,
} from "lucide-react";

// ─── 主题管理 ──────────────────────────────────────────────────

function getStoredTheme(): "light" | "dark" | "system" {
  return (localStorage.getItem("theme-demo") as "light" | "dark" | "system") ?? "light";
}

function applyTheme(mode: "light" | "dark" | "system") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (mode === "system") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    }
  } else {
    root.classList.add(mode);
  }
}

function ThemeSwitcher({
  value,
  onChange,
}: {
  value: "light" | "dark" | "system";
  onChange: (v: "light" | "dark" | "system") => void;
}) {
  const options: { value: "light" | "dark" | "system"; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "浅色", icon: <Sun className="size-4" /> },
    { value: "dark", label: "深色", icon: <Moon className="size-4" /> },
    { value: "system", label: "跟随系统", icon: <Monitor className="size-4" /> },
  ];

  return (
    <div className="inline-flex rounded-xl bg-[var(--color-demo-surface)] p-1 ring-1 ring-[var(--color-demo-border)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.label}
          aria-label={opt.label}
          className={`
            flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200
            ${
              value === opt.value
                ? "bg-[var(--color-demo-accent)] text-white shadow-sm"
                : "text-[var(--color-demo-text-secondary)] hover:text-[var(--color-demo-text-primary)] hover:bg-[var(--color-demo-surface-raised)]"
            }
          `}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── 颜色色块 ──────────────────────────────────────────────────

const colorGroups = [
  {
    label: "主色",
    items: [
      { name: "Primary 500", light: "bg-[#0ea5e9]", dark: "dark:bg-[#38bdf8]", text: "#0ea5e9" },
      { name: "Primary 400", light: "bg-[#38bdf8]", dark: "dark:bg-[#7dd3fc]", text: "#38bdf8" },
      { name: "Primary 600", light: "bg-[#0284c7]", dark: "dark:bg-[#0ea5e9]", text: "#0284c7" },
      { name: "Primary 700", light: "bg-[#0369a1]", dark: "dark:bg-[#0284c7]", text: "#0369a1" },
    ],
  },
  {
    label: "辅助色",
    items: [
      { name: "Accent 500", light: "bg-[#3b82f6]", dark: "dark:bg-[#60a5fa]", text: "#3b82f6" },
      { name: "Purple 500", light: "bg-[#a855f7]", dark: "dark:bg-[#c084fc]", text: "#a855f7" },
      { name: "Cyan 500", light: "bg-[#06b6d4]", dark: "dark:bg-[#22d3ee]", text: "#06b6d4" },
      { name: "Violet 500", light: "bg-[#8b5cf6]", dark: "dark:bg-[#a78bfa]", text: "#8b5cf6" },
    ],
  },
  {
    label: "语义色",
    items: [
      { name: "Success", light: "bg-[#22c55e]", dark: "dark:bg-[#4ade80]", text: "#22c55e" },
      { name: "Warning", light: "bg-[#f59e0b]", dark: "dark:bg-[#fbbf24]", text: "#f59e0b" },
      { name: "Danger", light: "bg-[#ef4444]", dark: "dark:bg-[#f87171]", text: "#ef4444" },
      { name: "Info", light: "bg-[#0ea5e9]", dark: "dark:bg-[#38bdf8]", text: "#0ea5e9" },
    ],
  },
  {
    label: "中性色",
    items: [
      { name: "Zinc 50", light: "bg-[#fafafa]", dark: "dark:bg-[#18181b]", text: "#fafafa" },
      { name: "Zinc 200", light: "bg-[#e4e4e7]", dark: "dark:bg-[#3f3f46]", text: "#e4e4e7" },
      { name: "Zinc 500", light: "bg-[#71717a]", dark: "dark:bg-[#a1a1aa]", text: "#71717a" },
      { name: "Zinc 900", light: "bg-[#18181b]", dark: "dark:bg-[#fafafa]", text: "#18181b" },
    ],
  },
];

function ColorPaletteSection() {
  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {colorGroups.map((group) => (
          <div
            key={group.label}
            className="rounded-2xl border border-[var(--color-demo-border)] bg-[var(--color-demo-surface)] p-5"
          >
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-demo-text-primary)]">
              {group.label}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  className={`relative flex aspect-[2/1] flex-col justify-end rounded-xl p-2.5 shadow-sm ${item.light} ${item.dark}`}
                >
                  <p
                    className="text-[10px] font-bold leading-tight"
                    style={{
                      color:
                        item.name.includes("Zinc 50") || item.name.includes("Zinc 900")
                          ? item.name.includes("Zinc 50")
                            ? "rgba(0,0,0,0.7)"
                            : "rgba(255,255,255,0.7)"
                          : "rgba(255,255,255,0.85)",
                    }}
                  >
                    {item.name}
                  </p>
                  <p
                    className="mt-0.5 text-[9px] font-medium"
                    style={{
                      color:
                        item.name.includes("Zinc 50") || item.name.includes("Zinc 900")
                          ? item.name.includes("Zinc 50")
                            ? "rgba(0,0,0,0.45)"
                            : "rgba(255,255,255,0.45)"
                          : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── 排版展示 ──────────────────────────────────────────────────

function TypographySection() {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[var(--color-demo-border)] bg-[var(--color-demo-surface)] p-6">
        <h3 className="mb-6 text-sm font-semibold text-[var(--color-demo-text-primary)]">
          字体层级
        </h3>
        <div className="space-y-5">
          {[
            { size: "text-4xl", weight: "font-bold", sample: "H1 · 大标题", sub: "text-4xl / font-bold / tracking-tight" },
            { size: "text-3xl", weight: "font-semibold", sample: "H2 · 章节标题", sub: "text-3xl / font-semibold / tracking-tight" },
            { size: "text-2xl", weight: "font-semibold", sample: "H3 · 卡片标题", sub: "text-2xl / font-semibold" },
            { size: "text-xl", weight: "font-medium", sample: "H4 · 小节标题", sub: "text-xl / font-medium" },
            { size: "text-base", weight: "font-normal", sample: "正文内容 · 辅助说明文字", sub: "text-base / font-normal / leading-relaxed" },
            { size: "text-sm", weight: "font-normal", sample: "次要描述 · 备注信息", sub: "text-sm / text-[var(--color-demo-text-secondary)]" },
            { size: "text-xs", weight: "font-medium", sample: "标签 · 徽章 · 辅助标注", sub: "text-xs / font-medium / uppercase tracking-wide" },
          ].map((row) => (
            <div key={row.sub} className="flex items-baseline justify-between gap-4 border-b border-[var(--color-demo-border-subtle)] pb-4 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className={`${row.size} ${row.weight} text-[var(--color-demo-text-primary)] leading-tight`}>
                  {row.sample}
                </p>
              </div>
              <p className="shrink-0 text-right text-[11px] text-[var(--color-demo-text-muted)]">
                {row.sub}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 按钮 ──────────────────────────────────────────────────────

function ButtonSection() {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[var(--color-demo-border)] bg-[var(--color-demo-surface)] p-6">
        <h3 className="mb-5 text-sm font-semibold text-[var(--color-demo-text-primary)]">
          按钮
        </h3>
        <div className="space-y-6">
          {/* Primary buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "主要按钮", cls: "bg-[var(--color-demo-accent)] text-white hover:bg-[var(--color-demo-accent-hover)]" },
              { label: "次要按钮", cls: "bg-[var(--color-demo-surface-raised)] text-[var(--color-demo-text-primary)] border border-[var(--color-demo-border)] hover:bg-[var(--color-demo-border)]" },
              { label: "幽灵按钮", cls: "text-[var(--color-demo-accent)] hover:bg-[var(--color-demo-accent-soft)]" },
              { label: "危险按钮", cls: "bg-[var(--color-demo-danger)] text-white hover:brightness-110" },
              { label: "禁用态", cls: "opacity-40 cursor-not-allowed", disabled: true },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                disabled={b.disabled}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-150 ${b.cls}`}
              >
                {b.label}
              </button>
            ))}
          </div>
          {/* Icon buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "主要", cls: "bg-[var(--color-demo-accent)] text-white", icon: <Star className="size-4" /> },
              { label: "成功", cls: "bg-[var(--color-demo-success)] text-white", icon: <Check className="size-4" /> },
              { label: "警告", cls: "bg-[var(--color-demo-warning)] text-white", icon: <Zap className="size-4" /> },
              { label: "危险", cls: "bg-[var(--color-demo-danger)] text-white", icon: <Heart className="size-4" /> },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                title={b.label}
                className={`inline-flex size-10 items-center justify-center rounded-xl shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${b.cls}`}
              >
                {b.icon}
              </button>
            ))}
          </div>
          {/* Sizes */}
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "小号", size: "px-3 py-1.5 text-xs rounded-lg" },
              { label: "中号", size: "px-4 py-2.5 text-sm rounded-xl" },
              { label: "大号", size: "px-6 py-3.5 text-base rounded-2xl" },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                className={`inline-flex items-center gap-2 bg-[var(--color-demo-accent)] text-white font-semibold shadow-sm transition-all hover:bg-[var(--color-demo-accent-hover)] ${b.size}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 表单 ──────────────────────────────────────────────────────

function FormSection() {
  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[var(--color-demo-border)] bg-[var(--color-demo-surface)] p-6">
        <h3 className="mb-5 text-sm font-semibold text-[var(--color-demo-text-primary)]">
          表单元素
        </h3>
        <div className="max-w-lg space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-demo-text-primary)]">
              标签
            </label>
            <input
              type="text"
              placeholder="请输入内容…"
              className="w-full rounded-xl border border-[var(--color-demo-border)] bg-[var(--color-demo-surface-raised)] px-4 py-2.5 text-sm text-[var(--color-demo-text-primary)] placeholder:text-[var(--color-demo-text-muted)] transition-colors focus:border-[var(--color-demo-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-demo-accent-ring)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-demo-text-primary)]">
              选择框
            </label>
            <select
              title="选择选项"
              className="w-full rounded-xl border border-[var(--color-demo-border)] bg-[var(--color-demo-surface-raised)] px-4 py-2.5 text-sm text-[var(--color-demo-text-primary)] transition-colors focus:border-[var(--color-demo-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-demo-accent-ring)]"
            >
              <option>选项一</option>
              <option>选项二</option>
              <option>选项三</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--color-demo-text-primary)]">
              多行文本
            </label>
            <textarea
              rows={3}
              placeholder="请输入多行文本…"
              className="w-full resize-y rounded-xl border border-[var(--color-demo-border)] bg-[var(--color-demo-surface-raised)] px-4 py-2.5 text-sm text-[var(--color-demo-text-primary)] placeholder:text-[var(--color-demo-text-muted)] transition-colors focus:border-[var(--color-demo-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-demo-accent-ring)]"
            />
          </div>
          {/* Checkboxes & radios */}
          <div className="flex flex-wrap gap-6">
            {[
              { label: "复选框", type: "checkbox" as const },
              { label: "单选框", type: "radio" as const, name: "demo-radio" },
            ].map((item) => (
              <label
                key={item.label}
                className="flex items-center gap-2.5 text-sm text-[var(--color-demo-text-primary)] cursor-pointer"
              >
                <span className={`
                  relative flex h-5 w-5 items-center justify-center rounded-md border transition-colors
                  ${item.type === "checkbox"
                    ? "border-[var(--color-demo-border)] bg-[var(--color-demo-surface-raised)]"
                    : "border-[var(--color-demo-border)] bg-[var(--color-demo-surface-raised)] rounded-full"
                  }
                `}>
                  <input
                    type={item.type}
                    name={item.name}
                    className="sr-only"
                  />
                </span>
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 徽章 ──────────────────────────────────────────────────────

function BadgeSection() {
  const badges = [
    { label: "默认", cls: "bg-[var(--color-demo-surface-raised)] text-[var(--color-demo-text-secondary)] border border-[var(--color-demo-border)]" },
    { label: "主色", cls: "bg-[var(--color-demo-accent-soft)] text-[var(--color-demo-accent)] border border-[var(--color-demo-accent-soft)]" },
    { label: "成功", cls: "bg-[var(--color-demo-success-soft)] text-[var(--color-demo-success)] border border-[var(--color-demo-success-soft)]" },
    { label: "警告", cls: "bg-[var(--color-demo-warning-soft)] text-[var(--color-demo-warning)] border border-[var(--color-demo-warning-soft)]" },
    { label: "危险", cls: "bg-[var(--color-demo-danger-soft)] text-[var(--color-demo-danger)] border border-[var(--color-demo-danger-soft)]" },
    { label: "紫色", cls: "bg-[var(--color-demo-purple-soft)] text-[var(--color-demo-purple)] border border-[var(--color-demo-purple-soft)]" },
  ];

  return (
    <section className="space-y-8">
      <div className="rounded-2xl border border-[var(--color-demo-border)] bg-[var(--color-demo-surface)] p-6">
        <h3 className="mb-5 text-sm font-semibold text-[var(--color-demo-text-primary)]">
          徽章
        </h3>
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${b.cls}`}
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 卡片 ──────────────────────────────────────────────────────

const demoCards = [
  {
    title: "AI 智能筛选",
    desc: "基于大语言模型对简历内容进行深度语义理解与评分排序，精准识别优质候选人。",
    tag: "AI 能力",
    tagClass: "bg-[var(--color-demo-accent-soft)] text-[var(--color-demo-accent)] border-[var(--color-demo-accent-soft)]",
    icon: <Zap className="size-5 text-[var(--color-demo-accent)]" />,
    stats: [{ label: "准确率", value: "96.8%" }, { label: "日处理", value: "1,200+" }],
  },
  {
    title: "安全可靠",
    desc: "全程数据加密传输与存储，严格权限控制，确保候选人隐私与商业机密安全。",
    tag: "安全合规",
    tagClass: "bg-[var(--color-demo-success-soft)] text-[var(--color-demo-success)] border-[var(--color-demo-success-soft)]",
    icon: <Shield className="size-5 text-[var(--color-demo-success)]" />,
    stats: [{ label: "安全等级", value: "AES-256" }, { label: "合规认证", value: "ISO 27001" }],
  },
  {
    title: "实时分析",
    desc: "流式输出 AI 筛选结果，随时查看处理进度与中间推理过程，过程透明可追溯。",
    tag: "实时能力",
    tagClass: "bg-[var(--color-demo-purple-soft)] text-[var(--color-demo-purple)] border-[var(--color-demo-purple-soft)]",
    icon: <Activity className="size-5 text-[var(--color-demo-purple)]" />,
    stats: [{ label: "延迟", value: "<200ms" }, { label: "可用性", value: "99.9%" }],
  },
];

function CardSection() {
  return (
    <section className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {demoCards.map((card) => (
          <article
            key={card.title}
            className="group relative flex flex-col rounded-2xl border border-[var(--color-demo-border)] bg-[var(--color-demo-surface)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/30"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-demo-surface-raised)] shadow-sm ring-1 ring-[var(--color-demo-border)]">
                {card.icon}
              </div>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${card.tagClass}`}>
                {card.tag}
              </span>
            </div>
            <h4 className="mb-2 text-base font-bold text-[var(--color-demo-text-primary)]">
              {card.title}
            </h4>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--color-demo-text-secondary)]">
              {card.desc}
            </p>
            <div className="mt-auto flex gap-4 border-t border-[var(--color-demo-border)] pt-4">
              {card.stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-[var(--color-demo-text-muted)]">{s.label}</p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--color-demo-text-primary)]">{s.value}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── 导航 Tab ──────────────────────────────────────────────────

function NavTab({
  items,
  active,
  onChange,
}: {
  items: { id: string; label: string; icon: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-[var(--color-demo-surface)] p-1 ring-1 ring-[var(--color-demo-border)]">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`
            flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200
            ${
              active === item.id
                ? "bg-[var(--color-demo-accent)] text-white shadow-sm"
                : "text-[var(--color-demo-text-secondary)] hover:text-[var(--color-demo-text-primary)] hover:bg-[var(--color-demo-surface-raised)]"
            }
          `}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── 主页面 ─────────────────────────────────────────────────────

type TabId = "color" | "type" | "button" | "form" | "badge" | "card";

export default function ThemeDemo() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(getStoredTheme);
  const [activeTab, setActiveTab] = useState<TabId>("color");

  useEffect(() => {
    localStorage.setItem("theme-demo", theme);
    applyTheme(theme);
  }, [theme]);

  // 监听系统主题变化（仅 system 模式生效）
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "color", label: "颜色", icon: <Palette className="size-4" /> },
    { id: "type", label: "排版", icon: <Type className="size-4" /> },
    { id: "button", label: "按钮", icon: <Layers className="size-4" /> },
    { id: "form", label: "表单", icon: <LayoutGrid className="size-4" /> },
    { id: "badge", label: "徽章", icon: <Star className="size-4" /> },
    { id: "card", label: "卡片", icon: <LayoutGrid className="size-4" /> },
  ];

  return (
    <div className="relative min-h-full">
      {/* 背景 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(56,189,248,0.06),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-demo-text-muted)]">
              Demo
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-demo-text-primary)]">
              主题系统
            </h1>
            <p className="mt-1 text-sm text-[var(--color-demo-text-secondary)]">
              浅色 / 深色主题切换，支持跟随系统首选项。
            </p>
          </div>
          <ThemeSwitcher value={theme} onChange={setTheme} />
        </header>

        {/* Nav tabs */}
        <div className="mb-8 overflow-x-auto">
          <NavTab items={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
        </div>

        {/* Sections */}
        {activeTab === "color" && <ColorPaletteSection />}
        {activeTab === "type" && <TypographySection />}
        {activeTab === "button" && <ButtonSection />}
        {activeTab === "form" && <FormSection />}
        {activeTab === "badge" && <BadgeSection />}
        {activeTab === "card" && <CardSection />}
      </div>
    </div>
  );
}
