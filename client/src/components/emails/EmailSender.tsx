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
import type { EmailTemplate, EmailRecipient } from "../../types/email-template";
import type { EmailConfig } from "../../types/email";

interface EmailSenderProps {
  onRefresh?: () => void;
  initialTemplateId?: number | null;
  onInitialTemplateApplied?: () => void;
  onTemplateCount?: (count: number) => void;
}

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

// 自定义 Select 组件（Dashboard 风格）
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
        className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/8 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
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

// 收件人行组件
function RecipientRow({
  recipient,
  checked,
  onToggle,
}: {
  recipient: EmailRecipient;
  checked: boolean;
  onToggle: () => void;
}) {
  const status = STATUS_CONFIG[recipient.status] ?? STATUS_CONFIG.pending;
  return (
    <label
      className={`
        group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-150
        ${
          checked
            ? "bg-zinc-100/70 ring-1 ring-zinc-300/50"
            : "hover:bg-zinc-50"
        }
      `}
    >
      {/* Checkbox */}
      <div
        className={`
          flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-150
          ${
            checked
              ? "bg-zinc-900 border-zinc-900 shadow-sm"
              : "border-zinc-300 bg-white group-hover:border-zinc-400"
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

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-zinc-900">
            {recipient.name}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${status.bg} ${status.border} ${status.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-zinc-400">
          {recipient.email && (
            <span className="flex items-center gap-1 truncate max-w-[180px]">
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

      {/* 简历附件标识 */}
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

  // 收件人筛选状态
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "passed" | "rejected"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 发送表单状态
  const [sendForm, setSendForm] = useState({
    templateId: 0,
    candidateIds: [] as number[],
    subject: "",
    body: "",
    fromEmailId: 0,
  });
  const [sending, setSending] = useState(false);

  // 加载收件人列表
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
        // 设置默认发件邮箱
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

  // 从「邮件模板」页带过来的模板：加载完成后自动选中并填充
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

  // 统计各状态数量
  const stats = {
    all: recipients.length,
    pending: recipients.filter((r) => r.status === "pending").length,
    passed: recipients.filter((r) => r.status === "passed").length,
    rejected: recipients.filter((r) => r.status === "rejected").length,
  };

  // 按状态 + 关键词筛选收件人
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

  // 切换状态筛选
  const handleStatusFilter = (
    status: "all" | "pending" | "passed" | "rejected",
  ) => {
    setStatusFilter(status);
  };

  // 选择模板时填充表单
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

  // 发送邮件
  const handleSend = async () => {
    if (!sendForm.fromEmailId) {
      alert("请选择发件邮箱");
      return;
    }
    if (!sendForm.subject || !sendForm.body) {
      alert("请填写邮件主题和内容");
      return;
    }
    if (sendForm.candidateIds.length === 0) {
      alert("请选择收件人");
      return;
    }

    setSending(true);
    try {
      const result = await sendEmails({
        templateId: sendForm.templateId || undefined,
        candidateIds: sendForm.candidateIds,
        subject: sendForm.subject,
        body: sendForm.body,
        fromEmailId: sendForm.fromEmailId,
      });
      await logActivity({
        type: "interview",
        description: `发送邮件给 ${sendForm.candidateIds.length} 位候选人`,
      });
      alert(result.message);
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
      alert(error instanceof Error ? error.message : "发送失败");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-zinc-400" />
          <span className="text-sm text-zinc-500">加载中...</span>
        </div>
      </div>
    );
  }

  const selectedCount = sendForm.candidateIds.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      {/* 左侧：邮件编辑 */}
      <div className="lg:col-span-7">
        <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/[0.03]">
          {/* 卡片头部 */}
          <div className="border-b border-zinc-100/80 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/12 ring-1 ring-inset ring-sky-500/25">
                <Mail className="h-[17px] w-[17px] text-sky-600" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
                  编辑邮件内容
                </h2>
                <p className="text-xs text-zinc-500">填写邮件信息，选择收件人并发送</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* 选择模板 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                选择模板
              </label>
              <Select
                value={sendForm.templateId}
                onChange={handleSelectTemplate}
                placeholder="-- 选择模板（可选） --"
                ariaLabel="选择邮件模板"
                options={templates.map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
              />
              {templates.length === 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                  <Settings size={12} strokeWidth={1.75} />
                  暂无模板，请先在「模板管理」中创建
                </p>
              )}
            </div>

            {/* 发件邮箱 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                发件邮箱 <span className="text-red-400">*</span>
              </label>
              <Select
                value={sendForm.fromEmailId}
                onChange={(v) =>
                  setSendForm({ ...sendForm, fromEmailId: v })
                }
                placeholder="-- 选择发件邮箱 --"
                ariaLabel="选择发件邮箱"
                options={emailConfigs.map((c) => ({
                  value: c.id,
                  label: `${c.email}${c.isDefault ? " · 默认" : ""}`,
                }))}
              />
              {emailConfigs.length === 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                  <Settings size={12} strokeWidth={1.75} />
                  暂无邮箱配置，请先在设置中添加邮箱
                </p>
              )}
            </div>

            {/* 邮件主题 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                邮件主题 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  value={sendForm.subject}
                  onChange={(e) =>
                    setSendForm({ ...sendForm, subject: e.target.value })
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/[0.08]"
                  placeholder="请输入邮件主题，支持变量替换"
                />
              </div>
            </div>

            {/* 邮件正文 */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-700">
                邮件正文 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={sendForm.body}
                onChange={(e) =>
                  setSendForm({ ...sendForm, body: e.target.value })
                }
                rows={12}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/[0.08] resize-none font-mono leading-relaxed"
                placeholder="尊敬的 {{name}} 您好：&#10;&#10;感谢您投递我们公司的 {{position}} 职位..."
              />
              {/* 变量快速插入 */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { key: "{{name}}", label: "姓名" },
                  { key: "{{email}}", label: "邮箱" },
                  { key: "{{phone}}", label: "电话" },
                  { key: "{{position}}", label: "职位" },
                ].map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() =>
                      setSendForm((prev) => ({
                        ...prev,
                        body: prev.body + v.key,
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500 shadow-sm transition-all hover:-translate-y-px hover:border-zinc-300 hover:text-zinc-700 hover:shadow"
                  >
                    <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-700">
                      {v.key}
                    </code>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：收件人选择 */}
      <div className="lg:col-span-5">
        {/* 收件人主卡片 */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/[0.03]">
          {/* 卡片头部 */}
          <div className="border-b border-zinc-100/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/12 ring-1 ring-inset ring-violet-500/25">
                  <User className="h-[17px] w-[17px] text-violet-600" strokeWidth={1.75} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
                    选择收件人
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {selectedCount > 0 ? (
                      <>
                        已选择{" "}
                        <span className="font-semibold text-violet-600">
                          {selectedCount}
                        </span>{" "}
                        人
                      </>
                    ) : (
                      "勾选候选人发送邮件"
                    )}
                  </p>
                </div>
              </div>
              {/* 清除选择 */}
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setSendForm((prev) => ({ ...prev, candidateIds: [] }))
                  }
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                  清除
                </button>
              )}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400"
                strokeWidth={1.75}
              />
              <input
                type="text"
                placeholder="搜索姓名、邮箱或电话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-11 pr-4 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/[0.08]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="清除搜索"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              )}
            </div>

            {/* 状态筛选标签组 */}
            <div className="flex items-center gap-1.5 flex-wrap">
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
                      inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150
                      ${
                        isActive
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                      }
                    `}
                  >
                    {label}
                    <span
                      className={`
                        rounded-full px-1.5 py-0.5 text-[10px] font-bold
                        ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-zinc-100 text-zinc-500"
                        }
                      `}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 收件人列表 */}
            <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 overflow-hidden">
              {filteredRecipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-200/80">
                    <User className="h-6 w-6 text-zinc-300" strokeWidth={1.25} />
                  </div>
                  <p className="text-sm font-medium text-zinc-600">
                    {searchQuery ? "没有匹配的收件人" : "暂无收件人数据"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {searchQuery ? "尝试其他关键词" : "请先添加候选人"}
                  </p>
                </div>
              ) : (
                <>
                  {/* 全选操作栏 */}
                  <div className="sticky top-0 z-10 border-b border-zinc-200/80 bg-zinc-50/90 px-3 py-2.5 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
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
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-200/70"
                      >
                        <div
                          className={`
                            flex h-4 w-4 items-center justify-center rounded border transition-all
                            ${
                              sendForm.candidateIds.length ===
                              filteredRecipients.length
                                ? "bg-zinc-900 border-zinc-900"
                                : "border-zinc-300 bg-white"
                            }
                          `}
                        >
                          {sendForm.candidateIds.length ===
                            filteredRecipients.length && (
                            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                          )}
                        </div>
                        {sendForm.candidateIds.length ===
                        filteredRecipients.length
                          ? "取消全选"
                          : "全选本页"}
                      </button>
                      <span className="text-[11px] text-zinc-400">
                        共 {filteredRecipients.length} 人
                      </span>
                    </div>
                  </div>

                  {/* 收件人列表 */}
                  <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
                    {filteredRecipients.map((r) => (
                      <RecipientRow
                        key={r.id}
                        recipient={r}
                        checked={sendForm.candidateIds.includes(r.id)}
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
        </div>

        {/* 发送按钮：独立于列表卡片，固定在底部 */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.08)] ring-1 ring-zinc-950/[0.03]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSend}
              disabled={
                sending ||
                emailConfigs.length === 0 ||
                selectedCount === 0 ||
                !sendForm.subject ||
                !sendForm.body
              }
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 hover:-translate-y-px hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  发送中...
                </>
              ) : selectedCount > 0 ? (
                <>
                  <Send className="h-4 w-4" strokeWidth={2} />
                  发送给 {selectedCount} 位收件人
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" strokeWidth={2} />
                  选择收件人发送
                </>
              )}
            </button>
          </div>

          {/* 验证提示 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              {
                ok: emailConfigs.length > 0,
                msg: "发件邮箱",
              },
              {
                ok: !!sendForm.subject,
                msg: "邮件主题",
              },
              {
                ok: !!sendForm.body,
                msg: "邮件正文",
              },
              {
                ok: selectedCount > 0,
                msg: "收件人",
              },
            ].map(({ ok, msg }) => (
              <span
                key={msg}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  ok
                    ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
                    : "bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200"
                }`}
              >
                {ok ? (
                  <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                ) : (
                  <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                )}
                {msg}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
