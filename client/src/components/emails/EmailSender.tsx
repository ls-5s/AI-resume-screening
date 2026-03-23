import { useState, useEffect, useRef } from "react";
import {
  Send,
  Mail,
  Phone,
  Search,
  User,
  FileText,
  Check,
  Settings,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import {
  getEmailTemplates,
  sendEmails,
  getEmailRecipients,
} from "../../api/email-template";
import { getEmailConfigs } from "../../api/email";
import { logActivity } from "../../api/dashboard";
import toast from "../../utils/toast";
import type { EmailTemplate, EmailRecipient } from "../../types/email-template";
import type { EmailConfig } from "../../types/email";

interface EmailSenderProps {
  onRefresh?: () => void;
  initialTemplateId?: number | null;
  onInitialTemplateApplied?: () => void;
  onTemplateCount?: (count: number) => void;
}

const CARD =
  "overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/3";

// 状态颜色映射
const STATUS_CONFIG = {
  pending: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    label: "待筛选",
    dot: "bg-amber-400",
  },
  passed: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    label: "已通过",
    dot: "bg-emerald-500",
  },
  rejected: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    label: "已拒绝",
    dot: "bg-red-500",
  },
};

function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  ariaLabel,
}: {
  value: number | string;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        aria-label={ariaLabel}
        className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/25 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
      >
        {placeholder && (
          <option value={0} disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
        strokeWidth={2}
      />
    </div>
  );
}

function RecipientRow({
  recipient,
  checked,
  onToggle,
  emailSendSuccess,
}: {
  recipient: EmailRecipient;
  checked: boolean;
  onToggle: () => void;
  /** 本会话内已成功投递邮件（由最近一次/多次发送结果汇总） */
  emailSendSuccess?: boolean;
}) {
  const status = STATUS_CONFIG[recipient.status] ?? STATUS_CONFIG.pending;
  return (
    <label
      className={`
        group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150
        ${
          checked
            ? "bg-sky-50/90 ring-1 ring-sky-200/70"
            : "hover:bg-white/80"
        }
      `}
    >
      <div
        className={`
          flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-150
          ${
            checked
              ? "border-sky-600 bg-sky-600 shadow-sm"
              : "border-zinc-300 bg-white group-hover:border-sky-300"
          }
        `}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
      </div>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onToggle}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
          <span className="truncate text-sm font-semibold text-zinc-900">
            {recipient.name}
          </span>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.border} ${status.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          {emailSendSuccess ? (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700"
              title="邮件已成功发出"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              发送成功
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-zinc-500">
          {recipient.email && (
            <span className="flex max-w-[180px] items-center gap-1 truncate">
              <Mail size={10} strokeWidth={1.5} />
              {recipient.email}
            </span>
          )}
          {recipient.phone && (
            <span className="flex items-center gap-1">
              <Phone size={10} strokeWidth={1.5} />
              {recipient.phone}
            </span>
          )}
        </div>
      </div>

      {recipient.resumeFile && (
        <FileText
          size={14}
          className="shrink-0 text-zinc-300"
          strokeWidth={1.5}
        />
      )}
    </label>
  );
}

function SenderSkeleton() {
  return (
    <div
      className="grid animate-pulse grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6"
      aria-hidden
    >
      <div className="lg:col-span-7">
        <div className={`${CARD} h-[min(32rem,70vh)]`}>
          <div className="border-b border-zinc-100 px-6 py-5">
            <div className="mb-2 h-3 w-20 rounded bg-zinc-100" />
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-2xl bg-zinc-100" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-4 w-40 rounded bg-zinc-100" />
                <div className="h-3 w-full max-w-xs rounded bg-zinc-100" />
              </div>
            </div>
          </div>
          <div className="space-y-6 p-6">
            <div className="h-32 rounded-2xl bg-zinc-100/80" />
            <div className="h-10 w-full rounded-2xl bg-zinc-100" />
            <div className="h-24 rounded-2xl bg-zinc-100" />
          </div>
        </div>
      </div>
      <div className="lg:col-span-5">
        <div className={`${CARD} h-[min(32rem,70vh)]`}>
          <div className="border-b border-zinc-100 px-5 py-4">
            <div className="h-4 w-28 rounded bg-zinc-100" />
          </div>
          <div className="p-5 space-y-4">
            <div className="h-10 rounded-xl bg-zinc-100" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 flex-1 rounded-lg bg-zinc-100" />
              ))}
            </div>
            <div className="h-48 rounded-2xl bg-zinc-100/80" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailSender({
  onRefresh,
  initialTemplateId,
  onInitialTemplateApplied,
  onTemplateCount,
}: EmailSenderProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const appliedInitialIdRef = useRef<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "passed" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [sendForm, setSendForm] = useState({
    templateId: 0,
    candidateIds: [] as number[],
    subject: "",
    body: "",
    fromEmailId: 0,
  });
  const [sending, setSending] = useState(false);
  /** 已成功发送过邮件的候选人 ID（本会话内累加，用于列表「发送成功」标记） */
  const [emailSentSuccessIds, setEmailSentSuccessIds] = useState<Set<number>>(
    () => new Set(),
  );

  const loadRecipients = async () => {
    try {
      const data = await getEmailRecipients();
      setRecipients(data);
    } catch (error) {
      console.error("加载收件人失败:", error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      try {
        const [templatesData, configsData] = await Promise.all([
          getEmailTemplates(),
          getEmailConfigs(),
        ]);
        if (cancelled) return;
        setTemplates(templatesData);
        setEmailConfigs(configsData);
        onTemplateCount?.(templatesData.length);
        await loadRecipients();
        const defaultConfig =
          configsData.find((c) => c.isDefault) || configsData[0];
        if (defaultConfig) {
          setSendForm((prev) => ({ ...prev, fromEmailId: defaultConfig.id }));
        }
      } catch (error) {
        if (!cancelled) console.error("加载数据失败:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [onTemplateCount]);

  useEffect(() => {
    if (loading || !initialTemplateId || templates.length === 0) return;
    if (appliedInitialIdRef.current === initialTemplateId) return;
    const template = templates.find((t) => t.id === initialTemplateId);
    if (template) {
      setSendForm((prev) => ({
        ...prev,
        templateId: template.id,
        subject: template.subject,
        body: template.body,
      }));
      appliedInitialIdRef.current = initialTemplateId;
      onInitialTemplateApplied?.();
    }
  }, [loading, initialTemplateId, templates, onInitialTemplateApplied]);

  const stats = {
    all: recipients.length,
    pending: recipients.filter((r) => r.status === "pending").length,
    passed: recipients.filter((r) => r.status === "passed").length,
    rejected: recipients.filter((r) => r.status === "rejected").length,
  };

  const filteredRecipients = recipients
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter((r) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.phone?.includes(query)
      );
    });

  const handleStatusFilter = (
    status: "all" | "pending" | "passed" | "rejected",
  ) => {
    setStatusFilter(status);
  };

  const handleSelectTemplate = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSendForm((prev) => ({
        ...prev,
        templateId: template.id,
        subject: template.subject,
        body: template.body,
      }));
    }
  };

  const handleSend = async () => {
    if (!sendForm.fromEmailId) {
      toast.error("请选择发件邮箱");
      return;
    }
    if (!sendForm.subject || !sendForm.body) {
      toast.error("请填写邮件主题和内容");
      return;
    }
    if (sendForm.candidateIds.length === 0) {
      toast.error("请选择收件人");
      return;
    }

    const batchIds = [...sendForm.candidateIds];
    setSending(true);
    try {
      const result = await sendEmails({
        templateId: sendForm.templateId || undefined,
        candidateIds: batchIds,
        subject: sendForm.subject,
        body: sendForm.body,
        fromEmailId: sendForm.fromEmailId,
      });
      await logActivity({
        type: "interview",
        description: `发送邮件给 ${result.sentCount} 位候选人`,
      });

      const succeeded =
        result.successfulCandidateIds && result.successfulCandidateIds.length > 0
          ? result.successfulCandidateIds
          : result.failedCount === 0 && result.sentCount > 0
            ? batchIds
            : [];

      if (succeeded.length > 0) {
        setEmailSentSuccessIds((prev) => {
          const next = new Set(prev);
          succeeded.forEach((id) => next.add(id));
          return next;
        });
      }

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      setSendForm((prev) => ({
        ...prev,
        candidateIds: [],
        subject: "",
        body: "",
        templateId: 0,
      }));
      onRefresh?.();
    } catch (error) {
      console.error("发送邮件失败:", error);
      toast.error(error instanceof Error ? error.message : "发送失败");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <SenderSkeleton />;
  }

  const selectedCount = sendForm.candidateIds.length;

  const readySteps = [
    { ok: emailConfigs.length > 0, msg: "发件邮箱" },
    { ok: !!sendForm.subject.trim(), msg: "主题" },
    { ok: !!sendForm.body.trim(), msg: "正文" },
    { ok: selectedCount > 0, msg: "收件人" },
  ] as const;

  const canSend =
    emailConfigs.length > 0 &&
    !!sendForm.subject.trim() &&
    !!sendForm.body.trim() &&
    selectedCount > 0 &&
    !sending;

  return (
    <div
      className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch lg:gap-6"
      aria-label="发送邮件工作区"
    >
      {/* 左侧：撰写（仪表盘式分区 + 大卡片） */}
      <section className="flex flex-col lg:col-span-7">
        <div className={`flex flex-1 flex-col ${CARD}`}>
          <header className="border-b border-zinc-100/80 px-6 py-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              Composer
            </p>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-[var(--app-primary)] to-[var(--app-accent)] text-white shadow-[0_2px_8px_rgba(14,165,233,0.35)]">
                <Mail className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                  撰写邮件
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  配置发信账号与模板，编辑主题与正文；收件人在右侧列表中选择
                </p>
              </div>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-8 p-6">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                发信设置
              </p>
              <div className="space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 ring-1 ring-inset ring-zinc-100/80">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-zinc-600">
                    邮件模板（可选）
                  </label>
                  <Select
                    value={sendForm.templateId}
                    onChange={handleSelectTemplate}
                    placeholder="不套用模板，手动撰写"
                    ariaLabel="选择邮件模板"
                    options={templates.map((t) => ({
                      value: t.id,
                      label: t.name,
                    }))}
                  />
                  {templates.length === 0 && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                      <Settings size={12} strokeWidth={1.75} />
                      暂无模板，可在「模板管理」中创建
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-zinc-600">
                    发件邮箱 <span className="text-red-400">*</span>
                  </label>
                  <Select
                    value={sendForm.fromEmailId}
                    onChange={(v) =>
                      setSendForm({ ...sendForm, fromEmailId: v })
                    }
                    placeholder="请选择发件邮箱"
                    ariaLabel="选择发件邮箱"
                    options={emailConfigs.map((c) => ({
                      value: c.id,
                      label: `${c.email}${c.isDefault ? " · 默认" : ""}`,
                    }))}
                  />
                  {emailConfigs.length === 0 && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                      <Settings size={12} strokeWidth={1.75} />
                      请先在设置中配置邮箱
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                主题与正文
              </p>
              <div className="flex flex-1 flex-col gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-zinc-600">
                    邮件主题 <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                      strokeWidth={1.75}
                    />
                    <input
                      type="text"
                      value={sendForm.subject}
                      onChange={(e) =>
                        setSendForm({ ...sendForm, subject: e.target.value })
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
                      placeholder="支持变量，如 {{name}}"
                    />
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col">
                  <label className="mb-2 block text-xs font-semibold text-zinc-600">
                    邮件正文 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={sendForm.body}
                    onChange={(e) =>
                      setSendForm({ ...sendForm, body: e.target.value })
                    }
                    className="min-h-[12rem] max-h-[min(26rem,44vh)] w-full flex-1 resize-y overflow-y-auto rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/25 lg:min-h-[14rem]"
                    placeholder={
                      "尊敬的 {{name}} 您好：\n\n感谢您投递我们公司的 {{position}} 职位..."
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 右侧：收件人侧栏（粘性 + 列表与发送一体化） */}
      <aside
        className={`flex flex-col lg:col-span-5 lg:sticky lg:top-4 lg:max-h-[min(100vh-5.5rem,56rem)] lg:self-start`}
      >
        <div className={`flex min-h-0 flex-1 flex-col ${CARD}`}>
          <header className="shrink-0 border-b border-zinc-100/80 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-inset ring-blue-400/20">
                  <User
                    className="h-[18px] w-[18px] text-blue-600"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Recipients
                  </p>
                  <h2 className="truncate text-sm font-semibold tracking-tight text-zinc-900">
                    选择收件人
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {selectedCount > 0 ? (
                      <>
                        已选{" "}
                        <span className="font-semibold tabular-nums text-blue-600">
                          {selectedCount}
                        </span>{" "}
                        / {stats.all} 人
                      </>
                    ) : (
                      <span>在列表中勾选候选人</span>
                    )}
                  </p>
                </div>
              </div>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSendForm((prev) => ({ ...prev, candidateIds: [] }))
                  }
                  className="shrink-0 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                >
                  清空
                </button>
              )}
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pt-4">
            <div className="relative shrink-0">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                strokeWidth={1.75}
              />
              <input
                type="search"
                placeholder="搜索姓名、邮箱或电话"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/80 py-2.5 pl-11 pr-4 text-sm text-zinc-900 transition-all focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="清除搜索"
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-zinc-600"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap gap-1.5">
              {(
                [
                  ["all", "全部"],
                  ["pending", "待筛选"],
                  ["passed", "已通过"],
                  ["rejected", "已拒绝"],
                ] as const
              ).map(([status, label]) => {
                const count =
                  status === "all"
                    ? stats.all
                    : stats[status as keyof typeof stats];
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusFilter(status)}
                    className={`
                      inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-all
                      ${
                        isActive
                          ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-500/30"
                          : "border border-zinc-200/90 bg-white text-zinc-600 hover:border-sky-200 hover:bg-sky-50/50"
                      }
                    `}
                  >
                    {label}
                    <span
                      className={`tabular-nums ${
                        isActive ? "text-sky-100" : "text-zinc-400"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-linear-to-b from-zinc-50/90 to-white ring-1 ring-inset ring-zinc-100/60">
              {filteredRecipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/80">
                    <User
                      className="h-7 w-7 text-zinc-300"
                      strokeWidth={1.25}
                    />
                  </div>
                  <p className="text-sm font-medium text-zinc-600">
                    {searchQuery ? "没有匹配的收件人" : "暂无收件人"}
                  </p>
                  <p className="mt-1 max-w-[220px] text-xs text-zinc-400">
                    {searchQuery
                      ? "更换关键词或筛选条件试试"
                      : "候选人数据将显示在此处"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white/90 px-3 py-2.5 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setSendForm((prev) => ({
                          ...prev,
                          candidateIds:
                            prev.candidateIds.length ===
                            filteredRecipients.length
                              ? []
                              : filteredRecipients.map((r) => r.id),
                        }))
                      }
                      className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[11px] font-semibold text-sky-700 transition-colors hover:bg-sky-50"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          sendForm.candidateIds.length ===
                          filteredRecipients.length
                            ? "border-sky-600 bg-sky-600"
                            : "border-zinc-300 bg-white"
                        }`}
                      >
                        {sendForm.candidateIds.length ===
                          filteredRecipients.length && (
                          <Check
                            className="h-2.5 w-2.5 text-white"
                            strokeWidth={3}
                          />
                        )}
                      </span>
                      {sendForm.candidateIds.length === filteredRecipients.length
                        ? "取消全选"
                        : "全选当前列表"}
                    </button>
                    <span className="text-[10px] font-medium tabular-nums text-zinc-400">
                      {filteredRecipients.length} 条
                    </span>
                  </div>
                  <div className="max-h-[min(360px,40vh)] min-h-[200px] flex-1 space-y-0.5 overflow-y-auto p-2">
                    {filteredRecipients.map((r) => (
                      <RecipientRow
                        key={r.id}
                        recipient={r}
                        checked={sendForm.candidateIds.includes(r.id)}
                        emailSendSuccess={emailSentSuccessIds.has(r.id)}
                        onToggle={() =>
                          setSendForm((prev) => ({
                            ...prev,
                            candidateIds: prev.candidateIds.includes(r.id)
                              ? prev.candidateIds.filter((x) => x !== r.id)
                              : [...prev.candidateIds, r.id],
                          }))
                        }
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 底部操作区：仪表盘式就绪条 + 主按钮 */}
          <footer className="shrink-0 border-t border-zinc-100/90 bg-zinc-50/40 px-5 py-4">
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[var(--app-primary)] to-[var(--app-accent)] py-3.5 text-sm font-semibold text-white shadow-[0_2px_14px_rgba(14,165,233,0.35)] transition-all hover:brightness-[0.97] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  发送中…
                </>
              ) : selectedCount > 0 ? (
                <>
                  <Send className="h-4 w-4" strokeWidth={2} />
                  发送给 {selectedCount} 位收件人
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 opacity-80" strokeWidth={2} />
                  请选择收件人后发送
                </>
              )}
            </button>

            <div
              className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-zinc-200/60 pt-3"
              role="status"
              aria-label="发送条件检查"
            >
              {readySteps.map(({ ok, msg }, i) => (
                <span
                  key={msg}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      ok
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-zinc-200/80 text-zinc-400"
                    }`}
                  >
                    {ok ? (
                      <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                    ) : (
                      <span className="text-[9px] font-bold">{i + 1}</span>
                    )}
                  </span>
                  {msg}
                </span>
              ))}
            </div>
          </footer>
        </div>
      </aside>
    </div>
  );
}
