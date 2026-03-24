import { useState, useEffect } from "react";
import { Modal, ConfirmModal } from "../../components/Modal";
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "../../api/email-template";
import type {
  EmailTemplate,
  CreateEmailTemplateData,
} from "../../types/email-template";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Mail,
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
  Eye,
  X,
  Loader2,
  LayoutTemplate,
  AtSign,
} from "lucide-react";

const PAGE_SIZE = 9;

/** 名称与主题一致时不在卡片上重复展示两段相同长文 */
function isSameNameAndSubject(name: string, subject: string) {
  return name.trim() === subject.trim();
}

interface EmailTemplateListProps {
  onRefresh?: () => void;
  onUseTemplate?: (template: EmailTemplate) => void;
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="animate-pulse rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.08)] ring-1 ring-zinc-950/[0.03]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-100" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded-lg bg-zinc-100" />
            <div className="h-3 w-20 rounded bg-zinc-100" />
          </div>
        </div>
        <div className="h-7 w-16 rounded-full bg-zinc-100" />
      </div>
      <div className="h-3 w-full rounded bg-zinc-100" />
      <div className="mt-2 h-3 w-3/4 rounded bg-zinc-100" />
    </div>
  );
}

export function EmailTemplateList({
  onRefresh,
  onUseTemplate,
}: EmailTemplateListProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);

  // 模板弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [formData, setFormData] = useState<CreateEmailTemplateData>({
    name: "",
    subject: "",
    body: "",
  });

  // 删除确认弹窗
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    template: EmailTemplate | null;
  }>({
    show: false,
    template: null,
  });

  // 加载模板
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("加载模板失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // 默认选中第一个模板
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates[0]);
    }
  }, [templates, selectedTemplate]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(templates.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedTemplates = templates.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  // 数据变少时若当前页超出范围，则回到最后一页
  useEffect(() => {
    if (templates.length > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [templates.length, totalPages, currentPage]);

  // 切换页时若当前选中项不在本页，则选中本页第一项
  useEffect(() => {
    if (templates.length === 0) return;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageTemplates = templates.slice(start, start + PAGE_SIZE);
    if (pageTemplates.length > 0 && selectedTemplate) {
      const isOnCurrentPage = pageTemplates.some(
        (t) => t.id === selectedTemplate.id,
      );
      if (!isOnCurrentPage) {
        setSelectedTemplate(pageTemplates[0]);
      }
    }
  }, [currentPage, templates, selectedTemplate]);

  // 打开弹窗
  const openModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: "",
        subject: "",
        body: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateEmailTemplate(editingTemplate.id, formData);
      } else {
        await createEmailTemplate(formData);
      }
      closeModal();
      loadTemplates();
      onRefresh?.();
    } catch (error) {
      console.error("保存模板失败:", error);
      alert(error instanceof Error ? error.message : "保存失败");
    }
  };

  // 删除模板
  const handleDelete = async () => {
    if (!deleteConfirm.template) return;
    try {
      await deleteEmailTemplate(deleteConfirm.template.id);
      if (selectedTemplate?.id === deleteConfirm.template.id) {
        setSelectedTemplate(null);
      }
      setDeleteConfirm({ show: false, template: null });
      loadTemplates();
      onRefresh?.();
    } catch (error) {
      console.error("删除模板失败:", error);
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* 卡片网格区域 */}
      {loading ? (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      ) : templates.length === 0 ? (
        /* 空状态 */
        <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/[0.03]">
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-200/80">
              <LayoutTemplate
                className="h-8 w-8 text-zinc-300"
                strokeWidth={1.25}
              />
            </div>
            <h3 className="mb-2 text-base font-semibold tracking-tight text-zinc-900">
              暂无邮件模板
            </h3>
            <p className="mb-7 max-w-xs text-sm text-zinc-500 leading-relaxed">
              创建您的第一个邮件模板，支持变量替换，快速向候选人发送个性化通知
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              创建第一个模板
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 操作栏 */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">
                共{" "}
                <span className="font-semibold text-zinc-800">
                  {templates.length}
                </span>{" "}
                个模板
              </span>
            </div>
            <button
              type="button"
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_-2px_rgba(14,165,233,0.45)] transition-all hover:brightness-105 hover:shadow-[0_4px_16px_-4px_rgba(14,165,233,0.5)] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              新建模板
            </button>
          </div>

          {/* 卡片网格 */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedTemplates.map((template, index) => {
              const isSelected = selectedTemplate?.id === template.id;
              return (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setPreviewTemplate(template);
                  }}
                  className={`
                    group relative cursor-pointer text-left rounded-2xl border p-5 transition-all duration-200
                    ${
                      isSelected
                        ? "border-sky-200/90 bg-white shadow-[0_4px_16px_-4px_rgba(14,165,233,0.14)] ring-2 ring-sky-300/45"
                        : "border-zinc-200/70 bg-white shadow-[0_1px_3px_-1px_rgba(15,23,42,0.08)] ring-1 ring-zinc-950/3 hover:-translate-y-px hover:border-sky-200/70 hover:shadow-[0_8px_24px_-8px_rgba(14,165,233,0.1)]"
                    }
                  `}
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {/* 顶部图标 + 操作按钮 */}
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isSelected
                            ? "bg-linear-to-br from-[var(--app-primary)] to-[var(--app-accent)] shadow-[0_2px_8px_rgba(14,165,233,0.35)]"
                            : "bg-zinc-100 ring-1 ring-zinc-200/80"
                        }`}
                      >
                        <Mail
                          className={`h-[18px] w-[18px] ${
                            isSelected ? "text-white" : "text-zinc-500"
                          }`}
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden pr-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                          模板名称
                        </p>
                        <h3 className="line-clamp-2 break-words text-left text-sm font-semibold leading-snug tracking-tight text-zinc-900">
                          {template.name}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <Clock
                            className="h-3 w-3 shrink-0"
                            strokeWidth={1.5}
                          />
                          {formatDate(template.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* 悬停时显示快捷操作 */}
                    <div
                      className={`
                        flex items-center gap-1 transition-all duration-200
                        ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                      `}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(template);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                        aria-label={`编辑模板 ${template.name}`}
                      >
                        <Edit className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm({ show: true, template });
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label={`删除模板 ${template.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>

                  {/* 主题行（与模板名称相同时不重复展示长文案） */}
                  <div className="mb-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-400">
                      邮件主题
                    </p>
                    {isSameNameAndSubject(template.name, template.subject) ? (
                      <p className="mt-1 text-sm text-zinc-400">
                        与模板名称相同
                      </p>
                    ) : (
                      <p className="mt-1 line-clamp-2 break-words text-sm font-medium text-zinc-700">
                        {template.subject}
                      </p>
                    )}
                  </div>

                  {/* 底部操作 */}
                  <div
                    className={`flex items-center justify-between border-t border-zinc-100 pt-3 transition-all duration-200 ${
                      isSelected
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Eye className="h-3 w-3" strokeWidth={1.5} />
                      点击预览
                    </div>
                    {onUseTemplate && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUseTemplate(template);
                        }}
                        className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
                      >
                        <Send className="h-3 w-3" strokeWidth={2} />
                        去使用
                      </button>
                    )}
                  </div>

                  {/* 选中指示器 */}
                  {isSelected && (
                    <div className="absolute -right-px -top-px h-3 w-3 rounded-bl-lg rounded-tr-2xl bg-sky-500 shadow-sm" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mb-8 flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-white px-5 py-3 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.08)] ring-1 ring-zinc-950/[0.03]">
              <span className="text-sm text-zinc-500">
                第 {currentPage} / {totalPages} 页，共 {templates.length} 个
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  aria-label="上一页"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentPage(i + 1)}
                    aria-label={`第 ${i + 1} 页`}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-xl px-2 text-sm font-medium transition-all ${
                      currentPage === i + 1
                        ? "bg-sky-600 text-white shadow-sm"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage >= totalPages}
                  aria-label="下一页"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 预览面板：独立浮层面板，Dashboard 风格 */}
      {previewTemplate && (
        <div className="mb-8 overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/[0.03]">
          {/* 预览面板头部 */}
          <div className="border-b border-zinc-100/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-200/80">
                  <Eye
                    className="h-[16px] w-[16px] text-sky-600"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="line-clamp-2 break-words text-sm font-semibold tracking-tight text-zinc-900">
                    {previewTemplate.name}
                  </h2>
                  <p className="text-xs text-zinc-500">模板预览</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onUseTemplate && (
                  <button
                    type="button"
                    onClick={() => onUseTemplate(previewTemplate)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
                  >
                    <Send className="h-3.5 w-3.5" strokeWidth={2} />
                    使用此模板
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openModal(previewTemplate)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300"
                  title="编辑"
                >
                  <Edit className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirm({ show: true, template: previewTemplate })
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                  title="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-600"
                  title="关闭预览"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          {/* 预览内容 */}
          <div className="p-6">
            {/* 邮件信息摘要 */}
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-sky-50/60 px-4 py-3 ring-1 ring-inset ring-sky-100/80">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-600/80 mb-1.5">
                  模板名称
                </p>
                <p className="line-clamp-3 break-words text-sm font-semibold text-zinc-900">
                  {previewTemplate.name}
                </p>
              </div>
              <div className="rounded-xl bg-sky-50/60 px-4 py-3 ring-1 ring-inset ring-sky-100/80">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-600/80 mb-1.5">
                  创建时间
                </p>
                <p className="text-sm font-medium text-zinc-700">
                  {formatDate(previewTemplate.createdAt)}
                </p>
              </div>
              <div className="rounded-xl bg-sky-50/60 px-4 py-3 ring-1 ring-inset ring-sky-100/80">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-600/80 mb-1.5">
                  最近更新
                </p>
                <p className="text-sm font-medium text-zinc-700">
                  {formatDate(previewTemplate.updatedAt) ??
                    formatDate(previewTemplate.createdAt)}
                </p>
              </div>
            </div>

            {/* 邮件主题 */}
            <div className="mb-5">
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                邮件主题
              </label>
              <div className="mt-2 flex min-w-0 items-center gap-3 rounded-xl border border-sky-100/90 bg-white px-4 py-3 shadow-sm ring-1 ring-inset ring-sky-100/60">
                <AtSign
                  className="h-4 w-4 shrink-0 text-sky-500"
                  strokeWidth={1.75}
                />
                <p className="min-w-0 text-sm font-medium text-zinc-900">
                  {isSameNameAndSubject(
                    previewTemplate.name,
                    previewTemplate.subject,
                  ) ? (
                    <span className="text-zinc-400">与模板名称相同</span>
                  ) : (
                    <span className="line-clamp-3 break-words">
                      {previewTemplate.subject}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 邮件正文 */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                邮件正文
              </label>
              <div className="mt-2 max-h-[min(22rem,42vh)] min-h-[8rem] overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 leading-relaxed shadow-sm ring-1 ring-inset ring-zinc-100 whitespace-pre-wrap [overflow-wrap:anywhere]">
                {previewTemplate.body}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模板编辑弹窗 — Dashboard 风格 */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-200/80">
              <FileText className="h-4 w-4 text-sky-600" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                {editingTemplate ? "编辑邮件模板" : "新建邮件模板"}
              </h2>
              <p className="text-xs text-zinc-500 font-normal">
                {editingTemplate ? "修改模板信息" : "创建新模板，支持变量替换"}
              </p>
            </div>
          </div>
        }
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-950/[0.04] transition-all hover:bg-zinc-50 hover:border-zinc-300"
            >
              取消
            </button>
            <button
              type="submit"
              form="template-form"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700"
            >
              <Loader2 className="h-4 w-4 hidden data-[loading=true]:inline animate-spin" />
              {editingTemplate ? "保存修改" : "创建模板"}
            </button>
          </>
        }
      >
        <form id="template-form" onSubmit={handleSubmit} className="space-y-5">
          {/* 模板名称 */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-700">
              模板名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
              placeholder="例如：面试邀请模板"
              required
            />
          </div>

          {/* 邮件主题 */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-700">
              邮件主题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
              placeholder="例如：{{name}}，恭喜您通过初筛！"
              required
            />
          </div>

          {/* 邮件正文 */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-700">
              邮件正文 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              className="w-full max-h-[min(20rem,38vh)] min-h-[10rem] resize-y overflow-y-auto rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-100 transition-all focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/25"
              placeholder="尊敬的 {{name}} 您好：&#10;&#10;感谢您投递我们公司的 {{position}} 职位..."
              required
            />
          </div>
        </form>
      </Modal>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, template: null })}
        onConfirm={handleDelete}
        title="删除模板"
        message={`确定要删除模板「${deleteConfirm.template?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        confirmVariant="danger"
      />
    </div>
  );
}

// 导出模板类型供外部使用
export type { EmailTemplate, CreateEmailTemplateData };
