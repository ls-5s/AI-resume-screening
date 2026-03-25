import { useState, useRef } from "react";
import {
  Palette, Layers, LayoutGrid,
  Check, Star, Heart, Zap, Shield, Activity, Eye,
  Trash2, Plus, ChevronLeft, ChevronRight,
  FileText, CheckCircle2, XCircle, AlertCircle,
  Loader2, BarChart3, Bell, X, Users,
  Clock3, Filter, ArrowUpDown, RefreshCw,
} from "lucide-react";
// ─── 1. 基础：颜色 + 排版 ───────────────────────────────────────

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
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {colorGroups.map((group) => (
          <div key={group.label} className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-5">
            <h3 className="mb-4 text-sm font-semibold text-(--color-demo-text-primary)">{group.label}</h3>
            <div className="grid grid-cols-2 gap-3">
              {group.items.map((item) => (
                <div
                  key={item.name}
                  className={`relative flex aspect-2/1 flex-col justify-end rounded-xl p-2.5 shadow-sm ${item.light} ${item.dark}`}
                  style={{
                    color: item.name.includes("Zinc 50") || item.name.includes("Zinc 900")
                      ? (item.name.includes("Zinc 50") ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)")
                      : "rgba(255,255,255,0.85)",
                  }}
                >
                  <p className="text-[10px] font-bold leading-tight">{item.name}</p>
                  <p className="mt-0.5 text-[9px] font-medium opacity-60">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TypographySection() {
  return (
    <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
      <h3 className="mb-6 text-sm font-semibold text-(--color-demo-text-primary)">字体层级</h3>
      <div className="space-y-5">
        {[
          { size: "text-4xl", weight: "font-bold", sample: "H1 · 大标题", sub: "text-4xl / font-bold / tracking-tight" },
          { size: "text-3xl", weight: "font-semibold", sample: "H2 · 章节标题", sub: "text-3xl / font-semibold" },
          { size: "text-2xl", weight: "font-semibold", sample: "H3 · 卡片标题", sub: "text-2xl / font-semibold" },
          { size: "text-xl", weight: "font-medium", sample: "H4 · 小节标题", sub: "text-xl / font-medium" },
          { size: "text-base", weight: "font-normal", sample: "正文内容 · 辅助说明文字", sub: "text-base / font-normal" },
          { size: "text-sm", weight: "font-normal", sample: "次要描述 · 备注信息", sub: "text-sm / text-(--color-demo-text-secondary)" },
          { size: "text-xs", weight: "font-medium", sample: "标签 · 徽章 · 辅助标注", sub: "text-xs / font-medium" },
        ].map((row) => (
          <div key={row.sub} className="flex items-baseline justify-between gap-4 border-b border-(--color-demo-border-subtle) pb-4 last:border-0 last:pb-0">
            <p className={`${row.size} ${row.weight} text-(--color-demo-text-primary) leading-tight`}>{row.sample}</p>
            <p className="shrink-0 text-right text-[11px] text-(--color-demo-text-muted)">{row.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. 按钮 + 徽章 ────────────────────────────────────────────

const badgeItems = [
  { label: "默认", cls: "bg-(--color-demo-surface-raised) text-(--color-demo-text-secondary) border border-(--color-demo-border)" },
  { label: "主色", cls: "bg-(--color-demo-accent-soft) text-(--color-demo-accent) border border-(--color-demo-accent-soft)" },
  { label: "成功", cls: "bg-(--color-demo-success-soft) text-(--color-demo-success) border border-(--color-demo-success-soft)" },
  { label: "警告", cls: "bg-(--color-demo-warning-soft) text-(--color-demo-warning) border border-(--color-demo-warning-soft)" },
  { label: "危险", cls: "bg-(--color-demo-danger-soft) text-(--color-demo-danger) border border-(--color-demo-danger-soft)" },
  { label: "紫色", cls: "bg-(--color-demo-purple-soft) text-(--color-demo-purple) border border-(--color-demo-purple-soft)" },
];

function ButtonSection() {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">按钮</h3>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "主要按钮", cls: "bg-(--color-demo-accent) text-white hover:bg-(--color-demo-accent-hover)" },
              { label: "次要按钮", cls: "bg-(--color-demo-surface-raised) text-(--color-demo-text-primary) border border-(--color-demo-border) hover:bg-(--color-demo-border)" },
              { label: "幽灵按钮", cls: "text-(--color-demo-accent) hover:bg-(--color-demo-accent-soft)" },
              { label: "危险按钮", cls: "bg-(--color-demo-danger) text-white hover:brightness-110" },
              { label: "禁用态", cls: "opacity-40 cursor-not-allowed", disabled: true },
            ].map((b) => (
              <button key={b.label} type="button" disabled={b.disabled} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-150 ${b.cls}`}>
                {b.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: "主要", cls: "bg-(--color-demo-accent) text-white", icon: <Star className="size-4" /> },
              { label: "成功", cls: "bg-(--color-demo-success) text-white", icon: <Check className="size-4" /> },
              { label: "警告", cls: "bg-(--color-demo-warning) text-white", icon: <Zap className="size-4" /> },
              { label: "危险", cls: "bg-(--color-demo-danger) text-white", icon: <Heart className="size-4" /> },
            ].map((b) => (
              <button key={b.label} type="button" title={b.label} className={`inline-flex size-10 items-center justify-center rounded-xl shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${b.cls}`}>
                {b.icon}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-(--color-demo-accent) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-(--color-demo-accent-hover)">
              <Plus className="size-4" /> 新建
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) px-4 py-2.5 text-sm font-medium text-(--color-demo-text-primary) shadow-sm transition-all hover:bg-(--color-demo-border)">
              <Eye className="size-4" /> 查看
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl border border-(--color-demo-danger-soft) bg-(--color-demo-danger-soft) px-4 py-2.5 text-sm font-medium text-(--color-demo-danger) shadow-sm transition-all hover:brightness-95">
              <Trash2 className="size-4" /> 删除
            </button>
            <button type="button" disabled className="inline-flex items-center gap-2 rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) px-4 py-2.5 text-sm font-medium text-(--color-demo-text-primary) opacity-50">
              <Loader2 className="size-4 animate-spin" /> 加载中…
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">徽章</h3>
        <div className="flex flex-wrap gap-2">
          {badgeItems.map((b) => (
            <span key={b.label} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${b.cls}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 3. 表单 ───────────────────────────────────────────────────

function FormSection() {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">表单元素</h3>
        <div className="max-w-lg space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-(--color-demo-text-primary)">文本输入框</label>
            <input type="text" placeholder="请输入内容…" className="w-full rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) px-4 py-2.5 text-sm text-(--color-demo-text-primary) placeholder:text-(--color-demo-text-muted) transition-colors focus:border-(--color-demo-accent) focus:outline-none focus:ring-2 focus:ring-(--color-demo-accent-ring)" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-(--color-demo-text-primary)">密码输入框</label>
            <div className="relative">
              <input type="password" defaultValue="Demo@1234" placeholder="请输入密码" className="w-full rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) px-4 py-2.5 pr-10 text-sm text-(--color-demo-text-primary) transition-colors focus:border-(--color-demo-accent) focus:outline-none focus:ring-2 focus:ring-(--color-demo-accent-ring)" />
              <button type="button" aria-label="显示密码" className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-demo-text-muted) hover:text-(--color-demo-text-secondary)">
                <Eye className="size-4" />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-(--color-demo-text-primary)">选择框</label>
            <select aria-label="选择框示例" className="w-full rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) px-4 py-2.5 text-sm text-(--color-demo-text-primary) transition-colors focus:border-(--color-demo-accent) focus:outline-none focus:ring-2 focus:ring-(--color-demo-accent-ring)">
              <option>选项一</option>
              <option>选项二</option>
              <option>选项三</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-(--color-demo-text-primary)">多行文本</label>
            <textarea rows={3} placeholder="请输入多行文本…" className="w-full resize-y rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) px-4 py-2.5 text-sm text-(--color-demo-text-primary) placeholder:text-(--color-demo-text-muted) transition-colors focus:border-(--color-demo-accent) focus:outline-none focus:ring-2 focus:ring-(--color-demo-accent-ring)" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-(--color-demo-text-primary)">错误状态</label>
            <input type="text" defaultValue="invalid input" placeholder="邮箱地址" className="w-full rounded-xl border border-(--color-demo-danger) bg-(--color-demo-danger-soft) px-4 py-2.5 text-sm text-(--color-demo-danger) transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-demo-danger)" />
            <p className="text-xs text-(--color-demo-danger)">请输入有效的邮箱地址</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-(--color-demo-text-primary)">复选框 & 单选框</label>
            <div className="flex flex-wrap gap-6">
              {[
                { label: "复选框", type: "checkbox" as const },
                { label: "单选框", type: "radio" as const, name: "demo-radio" },
              ].map((item) => (
                <label key={item.label} className="flex items-center gap-2.5 text-sm text-(--color-demo-text-primary) cursor-pointer">
                  <span className={`relative flex h-5 w-5 items-center justify-center rounded-md border border-(--color-demo-border) bg-(--color-demo-surface-raised) transition-colors ${item.type === "radio" ? "rounded-full" : ""}`}>
                    <input type={item.type} name={item.name} className="sr-only" />
                  </span>
                  {item.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-(--color-demo-text-primary)">Toggle 开关</label>
            <button type="button" role="switch" aria-checked="true" aria-label="开关" className="relative inline-flex h-6 w-11 items-center rounded-full bg-(--color-demo-accent) transition-colors">
              <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white shadow-sm transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 4. 卡片 + 统计 ─────────────────────────────────────────────

const demoStats = [
  { label: "总简历数", value: "1,284", change: "+12%", icon: <Users className="size-5" />, color: "accent" },
  { label: "待筛选", value: "423", change: "+5", icon: <Clock3 className="size-5" />, color: "warning" },
  { label: "已通过", value: "618", change: "+8", icon: <CheckCircle2 className="size-5" />, color: "success" },
  { label: "已拒绝", value: "243", change: "-3", icon: <XCircle className="size-5" />, color: "danger" },
];

const statColorMap = {
  accent: { icon: "text-(--color-demo-accent)" },
  warning: { icon: "text-(--color-demo-warning)" },
  success: { icon: "text-(--color-demo-success)" },
  danger: { icon: "text-(--color-demo-danger)" },
};

const demoCards = [
  {
    title: "AI 智能筛选", desc: "基于大语言模型对简历内容进行深度语义理解与评分排序，精准识别优质候选人。",
    tag: "AI 能力", tagClass: "bg-(--color-demo-accent-soft) text-(--color-demo-accent) border-(--color-demo-accent-soft)",
    icon: <Zap className="size-5 text-(--color-demo-accent)" />,
    stats: [{ label: "准确率", value: "96.8%" }, { label: "日处理", value: "1,200+" }],
  },
  {
    title: "安全可靠", desc: "全程数据加密传输与存储，严格权限控制，确保候选人隐私与商业机密安全。",
    tag: "安全合规", tagClass: "bg-(--color-demo-success-soft) text-(--color-demo-success) border-(--color-demo-success-soft)",
    icon: <Shield className="size-5 text-(--color-demo-success)" />,
    stats: [{ label: "安全等级", value: "AES-256" }, { label: "合规认证", value: "ISO 27001" }],
  },
  {
    title: "实时分析", desc: "流式输出 AI 筛选结果，随时查看处理进度与中间推理过程，过程透明可追溯。",
    tag: "实时能力", tagClass: "bg-(--color-demo-purple-soft) text-(--color-demo-purple) border-(--color-demo-purple-soft)",
    icon: <Activity className="size-5 text-(--color-demo-purple)" />,
    stats: [{ label: "延迟", value: "<200ms" }, { label: "可用性", value: "99.9%" }],
  },
];

function CardSection() {
  return (
    <section className="space-y-5">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {demoStats.map((s) => {
          const c = statColorMap[s.color as keyof typeof statColorMap];
          return (
            <div key={s.label} className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-demo-surface-raised) shadow-sm ring-1 ring-(--color-demo-border)">
                <span className={c.icon}>{s.icon}</span>
              </div>
              <p className="text-2xl font-bold text-(--color-demo-text-primary)">{s.value}</p>
              <p className="mt-1 text-xs text-(--color-demo-text-muted)">{s.label}</p>
              <p className={`mt-1 text-xs font-semibold ${s.change.startsWith("+") ? "text-(--color-demo-success)" : "text-(--color-demo-danger)"}`}>
                {s.change} 较上周
              </p>
            </div>
          );
        })}
      </div>

      {/* 功能卡片 */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {demoCards.map((card) => (
          <article key={card.title} className="group flex flex-col rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex size-10 items-center justify-center rounded-xl bg-(--color-demo-surface-raised) shadow-sm ring-1 ring-(--color-demo-border)">
                {card.icon}
              </div>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${card.tagClass}`}>
                {card.tag}
              </span>
            </div>
            <h4 className="mb-2 text-base font-bold text-(--color-demo-text-primary)">{card.title}</h4>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-(--color-demo-text-secondary)">{card.desc}</p>
            <div className="mt-auto flex gap-4 border-t border-(--color-demo-border) pt-4">
              {card.stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-(--color-demo-text-muted)">{s.label}</p>
                  <p className="mt-0.5 text-sm font-bold text-(--color-demo-text-primary)">{s.value}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── 5. 反馈：状态 Banner + 加载 + 空状态 ─────────────────────

function FeedbackSection() {
  const [loading, setLoading] = useState(false);
  const states = [    { status: "idle", label: "Idle", icon: <Bell className="size-4" /> },
    { status: "testing", label: "连接中…", icon: <Loader2 className="size-4 animate-spin" /> },
    { status: "success", label: "连接成功", icon: <CheckCircle2 className="size-4" /> },
    { status: "error", label: "连接失败", icon: <AlertCircle className="size-4" /> },
  ];
  const bannerStyle: Record<string, string> = {
    idle: "bg-(--color-demo-surface-raised) text-(--color-demo-text-secondary) border border-(--color-demo-border)",
    testing: "bg-(--color-demo-accent-soft) text-(--color-demo-accent) border border-(--color-demo-accent-soft)",
    success: "bg-(--color-demo-success-soft) text-(--color-demo-success) border border-(--color-demo-success-soft)",
    error: "bg-(--color-demo-danger-soft) text-(--color-demo-danger) border border-(--color-demo-danger-soft)",
  };

  return (
    <section className="space-y-5">
      {/* 状态 Banner */}
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">状态反馈 Banner</h3>
        <div className="space-y-3">
          {states.map((s) => (
            <div key={s.status} className={`flex items-center gap-3 rounded-xl px-4 py-3 ${bannerStyle[s.status]}`}>
              {s.icon}
              <span className="text-sm font-medium">{s.label}</span>
              {s.status === "error" && (
                <button type="button" aria-label="重试" className="ml-auto text-xs font-semibold underline underline-offset-2 hover:opacity-80">
                  重试
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 加载状态 */}
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">加载状态</h3>
        <div className="mb-5 flex items-center gap-3">
          <button
            type="button"
            aria-label="模拟加载"
            onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}
            className="inline-flex items-center gap-2 rounded-xl bg-(--color-demo-accent) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-(--color-demo-accent-hover)"
          >
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
            {loading ? "加载中…" : "模拟加载"}
          </button>
          {loading && <Loader2 className="size-6 animate-spin text-(--color-demo-accent)" />}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-(--color-demo-border-subtle) pb-4 last:border-0 last:pb-0">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-(--color-demo-surface-raised)" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-(--color-demo-surface-raised)" />
                <div className="h-3 w-20 animate-pulse rounded bg-(--color-demo-surface-raised)" />
              </div>
              <div className="h-8 w-8 animate-pulse rounded-lg bg-(--color-demo-surface-raised)" />
            </div>
          ))}
        </div>
      </div>

      {/* 空状态 */}
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">空状态</h3>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-(--color-demo-surface-raised) px-6 py-12 text-center ring-1 ring-inset ring-(--color-demo-border)">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-demo-surface) shadow-sm ring-1 ring-(--color-demo-border)">
            <FileText className="h-7 w-7 text-zinc-300" strokeWidth={1.25} />
          </div>
          <p className="text-sm font-medium text-(--color-demo-text-secondary)">暂无简历数据</p>
          <p className="mt-1 max-w-[240px] text-xs text-(--color-demo-text-muted)">上传简历或从邮箱导入，开始智能筛选候选人</p>
          <button type="button" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-(--color-demo-accent) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-(--color-demo-accent-hover)">
            <Plus className="size-4" /> 上传简历
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── 6. 弹窗 + 通知 ───────────────────────────────────────────

function PopupSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; type: "success" | "error" | "info" | "warning"; title: string; desc: string }>>([]);
  const idRef = useRef(0);

  const addToast = (type: "success" | "error" | "info" | "warning") => {
    const configs = {
      success: { title: "操作成功", desc: "简历已成功上传至服务器。" },
      error: { title: "操作失败", desc: "网络连接异常，请检查网络后重试。" },
      info: { title: "通知消息", desc: "您有 3 份新简历待筛选处理。" },
      warning: { title: "注意提醒", desc: "您的 AI 额度即将用完（剩余 23 次）。" },
    };
    const toast = { id: ++idRef.current, type, ...configs[type] };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 4000);
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const toastStyle = {
    success: { icon: <CheckCircle2 className="size-5 text-(--color-demo-success)" />, bg: "border-(--color-demo-success-soft)" },
    error: { icon: <XCircle className="size-5 text-(--color-demo-danger)" />, bg: "border-(--color-demo-danger-soft)" },
    info: { icon: <Bell className="size-5 text-(--color-demo-accent)" />, bg: "border-(--color-demo-accent-soft)" },
    warning: { icon: <AlertCircle className="size-5 text-(--color-demo-warning)" />, bg: "border-(--color-demo-warning-soft)" },
  };

  return (
    <section className="space-y-5">
      {/* 弹窗触发 */}
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">模态框</h3>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setAlertOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-(--color-demo-accent) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-(--color-demo-accent-hover)">
            <AlertCircle className="size-4" /> 提示弹窗
          </button>
          <button type="button" onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-(--color-demo-danger-soft) bg-(--color-demo-danger-soft) px-4 py-2.5 text-sm font-medium text-(--color-demo-danger) shadow-sm transition-all hover:brightness-95">
            <Trash2 className="size-4" /> 确认删除
          </button>
        </div>
      </div>

      {/* Toast 通知 */}
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">Toast 通知</h3>
        <div className="flex flex-wrap gap-2">
          {(["success", "error", "info", "warning"] as const).map((t) => (
            <button key={t} type="button" onClick={() => addToast(t)} className="inline-flex items-center gap-2 rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) px-4 py-2 text-sm font-medium text-(--color-demo-text-primary) transition-all hover:bg-(--color-demo-border)">
              {toastStyle[t].icon} {t === "success" ? "成功" : t === "error" ? "错误" : t === "info" ? "通知" : "警告"}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Modal */}
      {alertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setAlertOpen(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-demo-accent-soft) shadow-sm">
              <AlertCircle className="size-6 text-(--color-demo-accent)" />
            </div>
            <h2 className="text-base font-semibold text-(--color-demo-text-primary)">操作提示</h2>
            <p className="mt-2 text-sm text-(--color-demo-text-secondary)">已成功保存当前配置。</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setAlertOpen(false)} className="rounded-xl bg-(--color-demo-accent) px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-(--color-demo-accent-hover)">知道了</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmOpen(false)}>
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-(--color-demo-danger-soft) shadow-sm">
              <AlertCircle className="size-6 text-(--color-demo-danger)" />
            </div>
            <h2 className="text-base font-semibold text-(--color-demo-text-primary)">确认删除</h2>
            <p className="mt-2 text-sm text-(--color-demo-text-secondary)">确定要删除简历「张伟.pdf」吗？此操作不可恢复。</p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) px-4 py-2 text-sm font-medium text-(--color-demo-text-primary) transition-all hover:bg-(--color-demo-border)">取消</button>
              <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-xl bg-(--color-demo-danger) px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600">删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2" aria-live="polite">
        {toasts.map((toast) => {
          const s = toastStyle[toast.type];
          return (
            <div key={toast.id} className={`flex items-start gap-3 rounded-xl border bg-(--color-demo-surface) p-4 shadow-lg ring-1 ring-(--color-demo-border) ${s.bg}`}>
              {s.icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-(--color-demo-text-primary)">{toast.title}</p>
                <p className="mt-0.5 text-xs text-(--color-demo-text-secondary)">{toast.desc}</p>
              </div>
              <button type="button" aria-label="关闭通知" onClick={() => removeToast(toast.id)} className="shrink-0 text-(--color-demo-text-muted) hover:text-(--color-demo-text-secondary)">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── 7. 数据展示：分页 + 表格 + 时间线 + 进度 ───────────────────

const tableRows = [
  { name: "张伟", email: "zhangwei@example.com", phone: "138****1234", status: "passed" },
  { name: "刘洋", email: "liuyang@example.com", phone: "139****5678", status: "pending" },
  { name: "王明", email: "wangming@example.com", phone: "136****9012", status: "rejected" },
];
const statusStyle: Record<string, string> = {
  passed: "bg-(--color-demo-success-soft) text-(--color-demo-success) border border-(--color-demo-success-soft)",
  pending: "bg-(--color-demo-warning-soft) text-(--color-demo-warning) border border-(--color-demo-warning-soft)",
  rejected: "bg-(--color-demo-danger-soft) text-(--color-demo-danger) border border-(--color-demo-danger-soft)",
};
const statusLabel: Record<string, string> = { passed: "已通过", pending: "待筛选", rejected: "已拒绝" };

const activities = [
  { icon: <FileText className="size-4" />, iconBg: "bg-(--color-demo-accent-soft)", iconColor: "text-(--color-demo-accent)", kind: "上传", head: "张伟上传了简历", time: "3 分钟前" },
  { icon: <Zap className="size-4" />, iconBg: "bg-(--color-demo-purple-soft)", iconColor: "text-(--color-demo-purple)", kind: "AI 筛选", head: "AI 筛选完成：推荐通过", time: "12 分钟前" },
  { icon: <CheckCircle2 className="size-4" />, iconBg: "bg-(--color-demo-success-soft)", iconColor: "text-(--color-demo-success)", kind: "通过", head: "刘洋简历通过初筛", time: "1 小时前" },
  { icon: <XCircle className="size-4" />, iconBg: "bg-(--color-demo-danger-soft)", iconColor: "text-(--color-demo-danger)", kind: "拒绝", head: "王明简历未通过筛选", time: "2 小时前" },
];

function DataSection() {
  const [page, setPage] = useState(3);
  const [score, setScore] = useState(76);
  const total = 10;
  const R = 38;
  const C = 2 * Math.PI * R;
  const dashOffset = C - (score / 100) * C;

  const buildPageItems = (current: number, t: number) => {
    const items: Array<number | "..."> = [];
    for (let i = 1; i <= t; i++) {
      if (i === 1 || i === t || Math.abs(i - current) <= 1) {
        items.push(i);
      } else if (items[items.length - 1] !== "...") {
        items.push("...");
      }
    }
    return items;
  };

  return (
    <section className="space-y-5">
      {/* 分页条 */}
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">分页条</h3>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm text-(--color-demo-text-muted)">共 10 条 · 每页 10 条</span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="上一页" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="flex items-center gap-1 rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) p-2 text-(--color-demo-text-secondary) transition-colors hover:bg-(--color-demo-border) disabled:opacity-35 disabled:cursor-not-allowed">
              <ChevronLeft className="size-4" />
            </button>
            {buildPageItems(page, total).map((item, idx) =>
              item === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-sm text-(--color-demo-text-muted)">…</span>
              ) : (
                <button key={item} type="button" onClick={() => setPage(item)} className={`size-10 rounded-xl text-sm font-medium transition-colors ${page === item ? "bg-(--color-demo-accent) text-white shadow-sm" : "border border-(--color-demo-border) bg-(--color-demo-surface-raised) text-(--color-demo-text-secondary) hover:bg-(--color-demo-border)"}`}>
                  {item}
                </button>
              )
            )}
            <button type="button" aria-label="下一页" onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={page >= total} className="flex items-center gap-1 rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) p-2 text-(--color-demo-text-secondary) transition-colors hover:bg-(--color-demo-border) disabled:opacity-35 disabled:cursor-not-allowed">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm text-(--color-demo-text-muted)">每页显示：</span>
          <div className="flex items-center gap-1">
            {[10, 20, 50].map((size) => (
              <button key={size} type="button" className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${size === 10 ? "bg-(--color-demo-accent-soft) text-(--color-demo-accent) border border-(--color-demo-accent-soft)" : "border border-(--color-demo-border) bg-(--color-demo-surface-raised) text-(--color-demo-text-secondary) hover:bg-(--color-demo-border)"}`}>
                {size} 条
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-hidden rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface)">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-(--color-demo-border) bg-(--color-demo-surface-raised) text-xs font-medium uppercase tracking-wide text-(--color-demo-text-muted)">
              <th className="px-5 py-3">候选人</th>
              <th className="px-4 py-3">邮箱</th>
              <th className="px-4 py-3">电话</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-5 py-3 pr-5 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-demo-border-subtle)">
            {tableRows.map((row) => (
              <tr key={row.name} className="transition-colors hover:bg-(--color-demo-surface-raised)">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--color-demo-accent-soft) text-xs font-bold text-(--color-demo-accent)">{row.name[0]}</div>
                    <span className="font-medium text-(--color-demo-text-primary)">{row.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-(--color-demo-text-secondary)">{row.email}</td>
                <td className="px-4 py-3.5 text-(--color-demo-text-secondary) tabular-nums">{row.phone}</td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status]}`}>
                    {statusLabel[row.status]}
                  </span>
                </td>
                <td className="px-5 py-3.5 pr-5 text-right">
                  <div className="inline-flex items-center gap-0.5">
                    <button type="button" title="查看" className="rounded-md p-2 text-(--color-demo-text-muted) transition-colors hover:bg-(--color-demo-border) hover:text-(--color-demo-text-primary)">
                      <Eye className="size-4" />
                    </button>
                    <button type="button" title="删除" className="rounded-md p-2 text-(--color-demo-text-muted) transition-colors hover:bg-(--color-demo-danger-soft) hover:text-(--color-demo-danger)">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 时间线 */}
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">活动时间线</h3>
        <div className="space-y-0">
          {activities.map((act, idx) => (
            <div key={idx} className={`flex gap-4 ${idx !== activities.length - 1 ? "pb-4 border-b border-(--color-demo-border-subtle)" : ""} ${idx !== 0 ? "pt-4" : ""}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${act.iconBg}`}>
                <span className={act.iconColor}>{act.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-(--color-demo-accent)">{act.kind}</span>
                  <span className="text-sm font-medium text-(--color-demo-text-primary)">{act.head}</span>
                </div>
                <p className="mt-0.5 text-xs text-(--color-demo-text-muted)">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 匹配分 + 步骤进度 */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 匹配分圆环 */}
        <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-(--color-demo-text-primary)">匹配分圆环</h3>
            <input type="range" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} aria-label="匹配分滑块" className="w-28 accent-(--color-demo-accent)" />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="6" className="text-(--color-demo-surface-raised)" />
                <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={dashOffset} className="text-(--color-demo-accent) transition-[stroke-dashoffset] duration-700" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-(--color-demo-text-primary)">{score}</span>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-(--color-demo-text-muted)">匹配分</span>
              </div>
            </div>
            <div className="space-y-2.5 flex-1">
              {[
                { label: "技能匹配", value: Math.min(score + 5, 100) },
                { label: "学历背景", value: Math.max(score - 20, 0) },
                { label: "工作经验", value: Math.max(score - 10, 0) },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-(--color-demo-text-secondary)">{item.label}</span>
                    <span className="text-(--color-demo-text-muted)">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--color-demo-surface-raised)">
                    <div className="h-full rounded-full bg-(--color-demo-accent) transition-all duration-700" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 步骤进度 */}
        <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
          <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">步骤进度条</h3>
          <div className="space-y-4">
            {(["配置模板", "预览发送", "确认发送"] as const).map((label, idx) => {
              const done = idx < score / 33;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${done ? "bg-(--color-demo-success) text-white" : "border-2 border-(--color-demo-border) bg-(--color-demo-surface-raised) text-(--color-demo-text-muted)"}`}>
                    {done ? <Check className="size-4" /> : idx + 1}
                  </div>
                  <span className={`text-sm font-medium ${done ? "text-(--color-demo-success)" : "text-(--color-demo-text-muted)"}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 8. 进阶：搜索过滤 + 头像 ─────────────────────────────────

function AdvanceSection() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const filters = [
    { key: "all", label: "全部", count: 12 },
    { key: "passed", label: "已通过", count: 6 },
    { key: "rejected", label: "已拒绝", count: 3 },
    { key: "pending", label: "待筛选", count: 3 },
  ];

  return (
    <section className="space-y-5">
      {/* 搜索与过滤 */}
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">搜索与过滤</h3>
        <div className="space-y-4">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-demo-text-muted)" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索候选人姓名或邮箱…" className="w-full rounded-xl border border-(--color-demo-border) bg-(--color-demo-surface-raised) pl-10 pr-4 py-2.5 text-sm text-(--color-demo-text-primary) placeholder:text-(--color-demo-text-muted) transition-colors focus:border-(--color-demo-accent) focus:outline-none focus:ring-2 focus:ring-(--color-demo-accent-ring)" />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button key={f.key} type="button" onClick={() => setActiveFilter(f.key)} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${activeFilter === f.key ? "bg-(--color-demo-accent) text-white shadow-sm" : "border border-(--color-demo-border) bg-(--color-demo-surface-raised) text-(--color-demo-text-secondary) hover:border-(--color-demo-accent) hover:text-(--color-demo-accent)"}`}>
                {f.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${activeFilter === f.key ? "bg-white/20" : "bg-(--color-demo-surface)"}`}>{f.count}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-(--color-demo-text-muted)">排序：</span>
            {(["newest", "score", "name"] as const).map((s) => (
              <button key={s} type="button" className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${s === "newest" ? "bg-(--color-demo-accent-soft) text-(--color-demo-accent) border border-(--color-demo-accent-soft)" : "border border-(--color-demo-border) bg-(--color-demo-surface-raised) text-(--color-demo-text-secondary) hover:bg-(--color-demo-border)"}`}>
                <ArrowUpDown className="size-3" />
                {s === "newest" ? "最新" : s === "score" ? "分数" : "姓名"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 头像 */}
      <div className="rounded-2xl border border-(--color-demo-border) bg-(--color-demo-surface) p-6">
        <h3 className="mb-5 text-sm font-semibold text-(--color-demo-text-primary)">头像</h3>
        <div className="flex flex-wrap items-center gap-6">
          {[
            { size: "h-8 w-8", text: "text-xs" },
            { size: "h-10 w-10", text: "text-sm" },
            { size: "h-14 w-14", text: "text-lg" },
            { size: "h-20 w-20", text: "text-2xl" },
          ].map((s, i) => (
            <div key={i} className={`flex ${s.size} items-center justify-center rounded-xl bg-(--color-demo-accent) font-bold text-white ring-2 ring-(--color-demo-accent)/20 ${s.text}`}>
              李
            </div>
          ))}
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-(--color-demo-accent) text-lg font-bold text-white">王</div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--color-demo-success) ring-2 ring-(--color-demo-surface)">
              <Check className="size-2.5 text-white" strokeWidth={3} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── 导航 Tab ──────────────────────────────────────────────────

function NavTab({ items, active, onChange }: {
  items: { id: string; label: string; icon: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-(--color-demo-surface) p-1 ring-1 ring-(--color-demo-border)">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            active === item.id
              ? "bg-(--color-demo-accent) text-white shadow-sm"
              : "text-(--color-demo-text-secondary) hover:text-(--color-demo-text-primary) hover:bg-(--color-demo-surface-raised)"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── 主页面 ─────────────────────────────────────────────────────

type TabId = "basic" | "button" | "form" | "card" | "feedback" | "popup" | "data" | "advance";

export default function ThemeDemo() {
  const [activeTab, setActiveTab] = useState<TabId>("basic");

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "basic", label: "基础", icon: <Palette className="size-4" /> },
    { id: "button", label: "按钮", icon: <Layers className="size-4" /> },
    { id: "form", label: "表单", icon: <LayoutGrid className="size-4" /> },
    { id: "card", label: "卡片", icon: <LayoutGrid className="size-4" /> },
    { id: "feedback", label: "反馈", icon: <Bell className="size-4" /> },
    { id: "popup", label: "弹窗", icon: <AlertCircle className="size-4" /> },
    { id: "data", label: "数据", icon: <BarChart3 className="size-4" /> },
    { id: "advance", label: "进阶", icon: <Filter className="size-4" /> },
  ];

  return (
    <div className="relative min-h-full overflow-x-hidden">

      {/* 自定义滚动条 */}
      <style>{`
        .theme-demo-scroll::-webkit-scrollbar { width: 6px; }
        .theme-demo-scroll::-webkit-scrollbar-track { background: transparent; }
        .theme-demo-scroll::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.25); border-radius: 99px; }
        .theme-demo-scroll::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 128, 0.45); }
      `}</style>

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(88,166,255,0.05),transparent)]" aria-hidden />

      <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 theme-demo-scroll">
        <header className="mb-8">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-(--color-demo-text-muted)">Demo</p>
          <h1 className="text-2xl font-semibold tracking-tight text-(--color-demo-text-primary)">主题系统 & 组件库</h1>
          <p className="mt-1 text-sm text-(--color-demo-text-secondary)">浅色 / 深色主题切换，完整组件演示。</p>
        </header>

        <div className="mb-8 overflow-x-auto pb-1">
          <NavTab items={tabs} active={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
        </div>

        {activeTab === "basic" && (
          <section className="space-y-8">
            <ColorPaletteSection />
            <TypographySection />
          </section>
        )}
        {activeTab === "button" && <ButtonSection />}
        {activeTab === "form" && <FormSection />}
        {activeTab === "card" && <CardSection />}
        {activeTab === "feedback" && <FeedbackSection />}
        {activeTab === "popup" && <PopupSection />}
        {activeTab === "data" && <DataSection />}
        {activeTab === "advance" && <AdvanceSection />}
      </div>
    </div>
  );
}
