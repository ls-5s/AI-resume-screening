import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Copy,
  Star,
  StarOff,
  X,
  ArrowRight,
  Clock,
  Hash,
  Tag,
  ArrowLeft,
} from "lucide-react";
import {
  type ScreeningTemplate,
  loadTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate,
  duplicateTemplate,
} from "./templateApi";
import type { PreFilterConfig } from "../../components/aiscreening/preFilterUtils";
import {
  getDefaultPreFilter,
  isEmptyPreFilter,
} from "../../components/aiscreening/preFilterUtils";
import { PreFilterModal } from "../../components/aiscreening/PreFilterModal";

// ─── 条件预览 ──────────────────────────────────────────────────

function ConditionPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200/70">
      <span className="font-semibold">{value}</span>
      <span className="text-sky-400">·</span>
      {label}
    </span>
  );
}

function ConditionSummary({ config }: { config: PreFilterConfig }) {
  if (isEmptyPreFilter(config)) {
    return (
      <span className="text-xs text-zinc-400 italic">无过滤条件（全部通过）</span>
    );
  }
  const pills: { label: string; value: string }[] = [];
  if (config.keywords.trim()) {
    const kws = config.keywords
      .split(/[,，\s\n]+/)
      .map((k) => k.trim())
      .filter(Boolean);
    const preview =
      kws.length > 3
        ? `${kws.slice(0, 3).join(", ")} 等${kws.length}个`
        : kws.join(", ");
    pills.push({ label: "关键词", value: preview });
  }
  if (config.keywordMode === "and") {
    pills.push({ label: "匹配", value: "AND" });
  }
  if (config.minScore != null) {
    pills.push({ label: "最低分", value: `${config.minScore}分` });
  }
  if (config.dateFrom.trim()) {
    pills.push({ label: "导入从", value: config.dateFrom });
  }
  if (config.dateTo.trim()) {
    pills.push({ label: "导入至", value: config.dateTo });
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((p) => (
        <ConditionPill key={p.label} label={p.label} value={p.value} />
      ))}
    </div>
  );
}

// ─── 模板编辑器 Modal ──────────────────────────────────────────

type EditorMode = "create" | "edit";

interface EditorModalProps {
  open: boolean;
  mode: EditorMode;
  initial?: ScreeningTemplate;
  onClose: () => void;
  onSave: (name: string, config: PreFilterConfig) => void;
}

function EditorModal({ open, mode, initial, onClose, onSave }: EditorModalProps) {
  // 初始值直接从 props 同步，不在 effect 中 setState
  const [name, setName] = useState(() =>
    mode === "edit" && initial ? initial.name : "",
  );
  const [config, setConfig] = useState<PreFilterConfig>(() =>
    mode === "edit" && initial ? initial.config : getDefaultPreFilter(),
  );
  const [preFilterModalOpen, setPreFilterModalOpen] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("请输入模版名称");
      return;
    }
    onSave(name.trim(), config);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-modal-title"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" aria-hidden />
        <div className="relative flex max-h-[min(90vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)]">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/80 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-600/30">
                <Tag className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h2
                  id="editor-modal-title"
                  className="truncate text-base font-semibold text-zinc-900"
                >
                  {mode === "create" ? "新建筛选模版" : "编辑筛选模版"}
                </h2>
                <p className="truncate text-xs text-zinc-500">
                  {mode === "create"
                    ? "保存后可重复使用"
                    : "修改后将同步到已引用的位置"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-white hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1"
              title="关闭"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="tpl-name"
                  className="mb-2 block text-sm font-medium text-zinc-800"
                >
                  模版名称
                </label>
                <input
                  id="tpl-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：技术岗初筛、上海地区"
                  maxLength={60}
                  className="h-11 w-full rounded-xl border border-zinc-200/90 bg-white px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200/80"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-800">筛选条件</span>
                  <button
                    type="button"
                    onClick={() => setPreFilterModalOpen(true)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 focus-visible:outline-none focus-visible:underline"
                  >
                    编辑条件
                  </button>
                </div>
                <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-4 py-3">
                  <ConditionSummary config={config} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-wrap gap-2 border-t border-zinc-100 bg-zinc-50/90 px-5 py-3.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="ml-auto rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/30 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
            >
              {mode === "create" ? "创建模版" : "保存修改"}
            </button>
          </div>
        </div>
      </div>

      <PreFilterModal
        open={preFilterModalOpen}
        onClose={() => setPreFilterModalOpen(false)}
        config={config}
        onConfigChange={setConfig}
        onApply={() => setPreFilterModalOpen(false)}
      />
    </>
  );
}

// ─── 模板卡片 ───────────────────────────────────────────────────

interface TemplateCardProps {
  template: ScreeningTemplate;
  onEdit: (t: ScreeningTemplate) => void;
  onDuplicate: (t: ScreeningTemplate) => void;
  onDelete: (t: ScreeningTemplate) => void;
  onSetDefault: (t: ScreeningTemplate) => void;
  onApply: (t: ScreeningTemplate) => void;
}

function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
  onApply,
}: TemplateCardProps) {
  const createdDate = new Date(template.createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="group relative flex flex-col rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] transition-all hover:border-zinc-300 hover:shadow-[0_4px_16px_-4px_rgba(15,23,42,0.10)]">
      {/* Default badge */}
      {template.isDefault && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200/70">
          <Star className="h-3 w-3 fill-amber-400" aria-hidden />
          默认
        </span>
      )}

      {/* Header */}
      <div className="mb-3.5 pr-16">
        <h3 className="text-[15px] font-semibold text-zinc-900">{template.name}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          <Clock className="h-3 w-3 shrink-0" aria-hidden />
          {createdDate}
        </div>
      </div>

      {/* Condition summary */}
      <div className="mb-5 min-h-0 flex-1">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          包含条件
        </p>
        <ConditionSummary config={template.config} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
        <button
          type="button"
          onClick={() => onApply(template)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-600/20 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1"
        >
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          应用
        </button>
        <button
          type="button"
          onClick={() => onEdit(template)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
        >
          <Tag className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
          编辑
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(template)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
          title="复制模版"
        >
          <Copy className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
          复制
        </button>
        {!template.isDefault && (
          <button
            type="button"
            onClick={() => onSetDefault(template)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            title="设为默认"
          >
            <StarOff className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
            设为默认
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(template)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          title="删除模版"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          删除
        </button>
      </div>
    </div>
  );
}

// ─── 主页面 ─────────────────────────────────────────────────────

export default function ScreeningTemplate() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ScreeningTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>("create");
  const [editingTemplate, setEditingTemplate] = useState<ScreeningTemplate | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<ScreeningTemplate | null>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await loadTemplates();
      setTemplates(list);
      setError(null);
    } catch {
      setError("加载模版失败，请刷新重试");
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const handleCreate = () => {
    setEditingTemplate(undefined);
    setEditorMode("create");
    setEditorOpen(true);
  };

  const handleEdit = (t: ScreeningTemplate) => {
    setEditingTemplate(t);
    setEditorMode("edit");
    setEditorOpen(true);
  };

  const handleSave = async (name: string, config: PreFilterConfig) => {
    try {
      if (editorMode === "create") {
        await createTemplate(name, config);
        toast.success("模版创建成功");
      } else if (editingTemplate) {
        await updateTemplate(editingTemplate.id, { name, config });
        toast.success("模版已保存");
      }
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "保存失败");
    }
  };

  const handleDuplicate = async (t: ScreeningTemplate) => {
    try {
      await duplicateTemplate(t.id, `${t.name} (副本)`);
      toast.success("模版已复制");
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "复制失败");
    }
  };

  const handleDelete = (t: ScreeningTemplate) => setConfirmDelete(t);

  const confirmDeleteTemplate = async () => {
    if (!confirmDelete) return;
    try {
      await deleteTemplate(confirmDelete.id);
      toast.success("模版已删除");
      setConfirmDelete(null);
      await refresh();
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    }
  };

  const handleSetDefault = async (t: ScreeningTemplate) => {
    await setDefaultTemplate(t.id);
    toast.success(`已将「${t.name}」设为默认模版`);
    await refresh();
  };

  const handleApply = (t: ScreeningTemplate) => {
    localStorage.setItem("active-screening-template", String(t.id));
    toast.success(`已将「${t.name}」设为当前筛选条件`, {
      description: "正在跳转到 AI 筛选页面…",
    });
    navigate("/app/aiscreening");
  };

  return (
    <div className="relative min-h-full">
      {/* 背景 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.06),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1360px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <Link
              to="/app"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200/80 bg-white text-zinc-600 shadow-sm no-underline transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              aria-label="返回工作台"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Templates
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                筛选模版
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                保存常用的预筛选条件组合，一键应用到 AI 筛选流程中。
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/aiscreening"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
            >
              <ArrowRight className="h-4 w-4 -scale-x-100 text-zinc-400" aria-hidden />
              前往筛选
            </Link>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/30 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden />
              新建模版
            </button>
          </div>
        </header>

        {/* Content */}
        {loading ? null : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-16 text-center">
            <p className="text-sm font-medium text-rose-600">{error}</p>
            <button
              type="button"
              onClick={() => { setLoading(true); setError(null); refresh().finally(() => setLoading(false)); }}
              className="mt-3 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              重新加载
            </button>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-24 text-center ring-1 ring-inset ring-zinc-950/4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/80">
              <Hash className="h-7 w-7 text-zinc-300" strokeWidth={1.25} />
            </div>
            <p className="text-sm font-medium text-zinc-600">还没有筛选模版</p>
            <p className="mt-1.5 max-w-[280px] text-xs text-zinc-400">
              创建第一个模版，保存你的常用筛选条件组合
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-6 rounded-full bg-sky-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-sky-600/30 transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
            >
              创建第一个模版
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onSetDefault={handleSetDefault}
                onApply={handleApply}
              />
            ))}
          </div>
        )}
      </div>

      {/* Editor modal */}
      <EditorModal
        open={editorOpen}
        mode={editorMode}
        initial={editingTemplate}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label="确认删除"
        >
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm" aria-hidden />
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.25)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 ring-1 ring-rose-100">
              <Trash2 className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900">
              删除模版「{confirmDelete.name}」？
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              此操作不可撤销。已引用的位置将保留引用，但不会再自动更新。
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteTemplate}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-600/20 transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
