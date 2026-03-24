import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  getAiConfigs,
  createAiConfig,
  updateAiConfig,
  deleteAiConfig,
  testAiConfig,
} from "../../api/ai";
import type {
  AiConfig,
  UpdateAiConfigData,
  CreateAiConfigData,
} from "../../types/ai";
import {
  Bot,
  Plus,
  Trash2,
  Star,
  StarOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Copy,
} from "lucide-react";
import toast from "../../utils/toast";
import { Modal, ConfirmModal } from "../Modal";
import {
  StatusFeedback,
  EmptyState,
  FormInput,
  PasswordInput,
  ToggleSwitch,
  CardGrid,
  AnimatedCard,
} from "../ui";
import { SettingSkeleton } from "./SettingSkeleton";

// ============================================================================
// Constants
// ============================================================================

const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "deepseek-chat", label: "DeepSeek Chat" },
];

const PROMPT_TEMPLATES = [
  {
    id: "resume-screening",
    label: "简历筛选",
    description: "标准简历筛选提示词",
    value: `你是一个专业的简历筛选助手。请根据以下简历内容，评估候选人是否符合岗位要求。

岗位要求：
{job_requirements}

简历内容：
{resume_content}

请从以下几个方面进行评估：
1. 教育背景
2. 工作经历
3. 技能匹配度
4. 项目经验

请给出评估结果和建议。`,
  },
  {
    id: "candidate-scoring",
    label: "候选人评分",
    description: "多维度评分与排名",
    value: `你是一个专业的 HR 助手。请对以下简历候选人进行评分和排名。

候选人的简历内容：
{resume_content}

岗位要求：
{job_requirements}

请从以下维度评分（1-10分）：
1. 技能匹配度
2. 工作经验相关性
3. 教育背景
4. 项目经历质量
5. 发展潜力

请给出总分（1-100）、排名理由及是否推荐录用。`,
  },
  {
    id: "summary",
    label: "简历摘要",
    description: "快速提取关键信息",
    value: `请分析以下简历内容，提取关键信息并生成摘要。

简历内容：
{resume_content}

请提取：
- 姓名（如有）
- 最高学历与学校
- 最近工作经历（公司、职位、时间）
- 核心技术技能
- 关键项目经验（1-2个）

请用简洁的 bullet points 列出。`,
  },
  {
    id: "interview-questions",
    label: "面试问题",
    description: "生成针对性面试问题",
    value: `你是一个专业的面试官。请根据简历和岗位要求，生成针对性的面试问题。

简历内容：
{resume_content}

岗位要求：
{job_requirements}

请生成 5-8 个面试问题，包括：
1. 2-3 个技术相关问题（基于简历中的技能）
2. 1-2 个行为面试问题
3. 1-2 个针对简历中薄弱环节的追问
4. 1-2 个候选人反向提问的机会`,
  },
];

const defaultPrompt = PROMPT_TEMPLATES[0].value;

// ============================================================================
// Types
// ============================================================================

interface EditingConfig {
  id?: number;
  name: string;
  model: string;
  apiUrl: string;
  apiKey: string;
  prompt: string;
  isDefault: boolean;
}

interface TestResult {
  status: "idle" | "testing" | "success" | "error";
  message: string;
}

const emptyConfig: EditingConfig = {
  name: "",
  model: "gpt-4o",
  apiUrl: "https://api.openai.com/v1",
  apiKey: "",
  prompt: defaultPrompt,
  isDefault: false,
};

// ============================================================================
// Provider Colors
// ============================================================================

const providerColors: Record<
  string,
  { bg: string; text: string; badge: string }
> = {
  openai: {
    bg: "from-[#10a37f]/8 to-[#10a37f]/4",
    text: "text-[#10a37f]",
    badge: "bg-[#10a37f]/10 text-[#10a37f]",
  },
  anthropic: {
    bg: "from-orange-500/8 to-orange-400/4",
    text: "text-orange-500",
    badge: "bg-orange-50 text-orange-600",
  },
  deepseek: {
    bg: "from-sky-500/8 to-sky-400/4",
    text: "text-sky-600",
    badge: "bg-sky-50 text-sky-600",
  },
  moonshot: {
    bg: "from-sky-500/8 to-sky-400/4",
    text: "text-sky-600",
    badge: "bg-violet-50 text-sky-600",
  },
  alibaba: {
    bg: "from-orange-600/8 to-orange-500/4",
    text: "text-orange-600",
    badge: "bg-orange-50 text-orange-700",
  },
  default: {
    bg: "from-sky-500/8 to-blue-500/4",
    text: "text-sky-600",
    badge: "bg-sky-50 text-sky-600",
  },
};

const getProviderStyle = (apiUrl: string) => {
  const url = apiUrl.toLowerCase();
  if (url.includes("openai")) return providerColors.openai;
  if (url.includes("anthropic")) return providerColors.anthropic;
  if (url.includes("deepseek")) return providerColors.deepseek;
  if (url.includes("moonshot")) return providerColors.moonshot;
  if (url.includes("dashscope") || url.includes("aliyun"))
    return providerColors.alibaba;
  return providerColors.default;
};

// ============================================================================
// Model Icon
// ============================================================================

const ModelIcon = ({ apiUrl }: { apiUrl: string }) => {
  const url = apiUrl.toLowerCase();

  if (url.includes("openai")) {
    return (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
      >
        <rect width="24" height="24" rx="6" fill="#10a37f" />
        <path d="M12 6L7 9l5 3 5-3-5-3z" fill="white" />
        <path d="M7 15l5 3 5-3-5-3v6z" fill="white" />
      </svg>
    );
  }
  if (url.includes("anthropic")) {
    return (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
      >
        <rect width="24" height="24" rx="6" fill="#d97706" />
        <text
          x="12"
          y="17"
          textAnchor="middle"
          fill="white"
          fontSize="13"
          fontWeight="700"
          fontFamily="sans-serif"
        >
          A
        </text>
      </svg>
    );
  }
  if (url.includes("deepseek")) {
    return (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
      >
        <rect width="24" height="24" rx="6" fill="#0ea5e9" className="fill-sky-500" />
        <path d="M7 7h4v10H7z" fill="white" />
        <path d="M13 7h4v6h-4z" fill="white" />
        <path d="M7 12h10" stroke="white" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100">
      <Bot className="h-5 w-5 text-sky-600" />
    </div>
  );
};

// ============================================================================
// AI Config Card
// ============================================================================

const AiConfigCard = ({
  config,
  onEdit,
  onDelete,
  onSetDefault,
  loading,
}: {
  config: AiConfig;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  loading: boolean;
}) => {
  const provider = getProviderStyle(config.apiUrl);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition-all duration-300 hover:border-zinc-200 hover:shadow-lg hover:-translate-y-0.5">
      {/* Gradient top accent */}
      <div className={`h-1 w-full bg-gradient-to-r ${provider.bg}`} />

      {/* Card Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ModelIcon apiUrl={config.apiUrl} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-zinc-900">
                  {config.name}
                </h3>
                {config.isDefault && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600 ring-1 ring-inset ring-sky-200">
                    <Star className="h-2.5 w-2.5 fill-sky-500" />
                    默认
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-zinc-400">
                {config.model}
              </p>
            </div>
          </div>
        </div>

        {/* Info List */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono truncate">{config.apiUrl}</span>
          </div>
          {config.prompt && (
            <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
              {config.prompt.replace(/\n+/g, " ").trim()}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-between border-t border-zinc-50 pt-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex items-center gap-1">
            {!config.isDefault && (
              <button
                onClick={onSetDefault}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed"
              >
                <StarOff className="h-3.5 w-3.5" />
                设为默认
              </button>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={onEdit}
              disabled={loading}
              title="编辑"
              className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              disabled={loading}
              title="删除"
              className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div
        className={`h-0.5 w-0 bg-gradient-to-r ${provider.bg} transition-all duration-500 group-hover:w-full`}
      />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function AiSettings() {
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EditingConfig>(emptyConfig);
  const [originalData, setOriginalData] = useState<EditingConfig>(emptyConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult>({
    status: "idle",
    message: "",
  });
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const [activeTemplateId, setActiveTemplateId] =
    useState<string>("resume-screening");

  const formRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const isEditing = editingId !== null;
  const modalTitle = isEditing ? "编辑配置" : "添加配置";

  // Check if form has unsaved changes
  const isDirty = useMemo(
    () =>
      formData.name !== originalData.name ||
      formData.model !== originalData.model ||
      formData.apiUrl !== originalData.apiUrl ||
      formData.apiKey !== originalData.apiKey ||
      formData.prompt !== originalData.prompt ||
      formData.isDefault !== originalData.isDefault,
    [formData, originalData],
  );

  const defaultConfigId = useMemo(() => {
    const found = configs.find((c) => c.isDefault);
    return found?.id ?? null;
  }, [configs]);

  // Load configs
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAiConfigs();
      setConfigs(data);
    } catch (error) {
      console.error("加载 AI 配置列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  // Snapshot for rollback
  const snapshot = useRef<EditingConfig>(emptyConfig);

  // Open modal for add
  const handleAdd = () => {
    snapshot.current = emptyConfig;
    setFormData(emptyConfig);
    setOriginalData(emptyConfig);
    setEditingId(null);
    setShowApiKey(false);
    setTestResult({ status: "idle", message: "" });
    setShowPromptTemplates(false);
    setActiveTemplateId("resume-screening");
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (config: AiConfig) => {
    const data: EditingConfig = {
      id: config.id || undefined,
      name: config.name,
      model: config.model,
      apiUrl: config.apiUrl,
      apiKey: config.apiKey || "",
      prompt: config.prompt || defaultPrompt,
      isDefault: config.isDefault,
    };
    snapshot.current = data;
    setFormData(data);
    setOriginalData(data);
    setEditingId(config.id || null);
    setShowApiKey(false);
    setTestResult({ status: "idle", message: "" });
    setShowPromptTemplates(false);
    const matched = PROMPT_TEMPLATES.find((t) => t.value === config.prompt);
    setActiveTemplateId(matched?.id ?? "");
    setIsModalOpen(true);
  };

  // Close with dirty check
  const closeModal = useCallback(() => {
    if (isDirty) {
      cancelRef.current?.focus();
      const confirmed = window.confirm("有未保存的更改，确定要关闭吗？");
      if (!confirmed) return;
    }
    setIsModalOpen(false);
    setTestResult({ status: "idle", message: "" });
  }, [isDirty]);

  const applyTemplate = useCallback((templateId: string) => {
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setFormData((prev) => ({ ...prev, prompt: template.value }));
      setActiveTemplateId(templateId);
      setShowPromptTemplates(false);
    }
  }, []);

  // Save config
  const handleSave = useCallback(async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      toast.error("请输入配置名称");
      return;
    }
    if (!formData.apiUrl) {
      toast.error("请输入 API 地址");
      return;
    }

    setSaving(true);
    try {
      const data: CreateAiConfigData | UpdateAiConfigData = {
        name: trimmedName,
        model: formData.model,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey || undefined,
        prompt: formData.prompt || defaultPrompt,
        isDefault: formData.isDefault,
      };

      if (editingId) {
        await updateAiConfig(editingId, data);
        toast.success("配置更新成功");
      } else {
        await createAiConfig(data as CreateAiConfigData);
        toast.success("配置添加成功");
      }

      setIsModalOpen(false);
      void loadConfigs();
    } catch {
      toast.error("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  }, [formData, editingId, loadConfigs]);

  // Test connection
  const handleTest = useCallback(async () => {
    if (!formData.apiUrl || !formData.apiKey) {
      setTestResult({
        status: "error",
        message: "请先填写 API 地址与 API Key",
      });
      return;
    }

    setTestResult({ status: "testing", message: "正在连接..." });
    try {
      const result = await testAiConfig({
        model: formData.model,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey,
      });
      if (result.success) {
        setTestResult({
          status: "success",
          message: result.message || "连接成功",
        });
      } else {
        setTestResult({
          status: "error",
          message: result.message || "连接失败",
        });
      }
    } catch {
      setTestResult({ status: "error", message: "连接失败，请检查配置" });
    }
  }, [formData]);

  // Delete flow
  const requestDelete = useCallback((id: number) => setDeleteId(id), []);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteAiConfig(deleteId);
      toast.success("配置删除成功");
      setDeleteId(null);
      void loadConfigs();
    } catch {
      toast.error("删除失败，请稍后重试");
    } finally {
      setDeleting(false);
    }
  }, [deleteId, loadConfigs]);

  // Set default
  const handleSetDefault = useCallback(
    async (id: number) => {
      try {
        await updateAiConfig(id, { isDefault: true });
        toast.success("已设为默认配置");
        void loadConfigs();
      } catch {
        toast.error("设置失败，请稍后重试");
      }
    },
    [loadConfigs],
  );

  // Render form content
  const renderFormContent = () => (
    <div ref={formRef} className="space-y-5">
      {/* Test result */}
      <StatusFeedback
        result={testResult}
        onRetry={handleTest}
        labels={{
          testing: "正在测试连接...",
          success: "连接成功",
          error: "连接失败",
        }}
      />

      {/* Default config warning */}
      {defaultConfigId && !formData.isDefault && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            当前默认配置 ID:{" "}
            <span className="font-semibold">{defaultConfigId}</span>。
            勾选「设为默认配置」将覆盖当前默认设置。
          </p>
        </div>
      )}

      {/* Basic config */}
      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="配置名称"
            value={formData.name}
            onChange={(v) => setFormData((p) => ({ ...p, name: v as string }))}
            placeholder="例如：OpenAI GPT-4"
            required
          />

          <FormInput
            label="AI 模型"
            value={formData.model}
            onChange={(v) => setFormData((p) => ({ ...p, model: v as string }))}
            placeholder="gpt-4o"
            hint={`常用：${AI_MODELS.map((m) => m.value).join("、")}`}
          />

          <FormInput
            label="API 地址"
            value={formData.apiUrl}
            onChange={(v) =>
              setFormData((p) => ({ ...p, apiUrl: v as string }))
            }
            placeholder="https://api.openai.com/v1"
            hint="支持 OpenAI/Claude/DeepSeek 等"
          />

          <div className="md:col-span-2">
            <PasswordInput
              label="API Key"
              value={formData.apiKey}
              onChange={(v) => setFormData((p) => ({ ...p, apiKey: v }))}
              showPassword={showApiKey}
              onToggle={() => setShowApiKey((v) => !v)}
              placeholder="sk-..."
            />
          </div>
        </div>

        <div className="mt-4">
          <ToggleSwitch
            label="设为默认配置"
            description="新的简历筛选会优先使用默认配置"
            checked={formData.isDefault}
            onChange={(checked) =>
              setFormData((p) => ({ ...p, isDefault: checked }))
            }
          />
        </div>
      </div>

      {/* Prompt section */}
      <div className="rounded-2xl border border-zinc-100 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <label className="flex items-center gap-1 text-sm font-medium text-zinc-700">
            <Bot className="h-4 w-4" />
            AI 提示词
          </label>
          <div className="flex items-center gap-2">
            {/* Template dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPromptTemplates((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
              >
                <Bot className="h-3.5 w-3.5" />
                模板
                <ChevronDown className="h-3 w-3" />
              </button>

              {showPromptTemplates && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPromptTemplates(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border border-zinc-200 bg-white shadow-xl">
                    {PROMPT_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t.id)}
                        className={`flex w-full flex-col items-start gap-0.5 border-b border-zinc-100 px-4 py-3 text-left transition-colors hover:bg-zinc-50 ${
                          activeTemplateId === t.id ? "bg-sky-50" : ""
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-sm font-medium text-zinc-900">
                            {t.label}
                          </span>
                          {activeTemplateId === t.id && (
                            <CheckCircle2 className="h-4 w-4 text-sky-500" />
                          )}
                        </div>
                        <span className="text-xs text-zinc-400">
                          {t.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() =>
                setFormData((p) => ({ ...p, prompt: defaultPrompt }))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-500 shadow-sm transition-colors hover:bg-zinc-50"
              title="恢复默认提示词"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        <textarea
          value={formData.prompt}
          onChange={(e) =>
            setFormData((p) => ({ ...p, prompt: e.target.value }))
          }
          className="w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="请输入 AI 提示词"
          rows={8}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            可用变量：
            <code className="rounded bg-zinc-100 px-1 font-mono text-sky-600">
              {"{job_requirements}"}
            </code>{" "}
            <code className="rounded bg-zinc-100 px-1 font-mono text-sky-600">
              {"{resume_content}"}
            </code>
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(formData.prompt);
              toast.success("提示词已复制");
            }}
            className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-zinc-600"
          >
            <Copy className="h-3 w-3" />
            复制
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/3">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between p-6 pb-0">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            AI 配置
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            配置多个 AI 模型用于简历筛选
            {configs.length > 0 && (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">
                {configs.length} 个配置
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105"
        >
          <Plus className="h-4 w-4" />
          添加配置
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <SettingSkeleton rows={3} message="加载 AI 配置中..." />
      ) : configs.length === 0 ? (
        <div className="px-6 pb-6">
          <EmptyState
            title="还没有 AI 配置"
            description="添加你的第一个 AI 模型配置，开始智能简历筛选"
            actionLabel="创建第一个配置"
            onAction={handleAdd}
            features={[
              { icon: Bot, text: "GPT-4" },
              { icon: Bot, text: "Claude" },
              { icon: Bot, text: "DeepSeek" },
            ]}
          />
        </div>
      ) : (
        <div className="px-6 pb-6">
          <CardGrid cols={3} gap="md">
            {configs.map((config, index) => (
              <AnimatedCard key={config.id} index={index}>
                <AiConfigCard
                  config={config}
                  onEdit={() => handleEdit(config)}
                  onDelete={() => requestDelete(config.id!)}
                  onSetDefault={() => handleSetDefault(config.id!)}
                  loading={loading}
                />
              </AnimatedCard>
            ))}
          </CardGrid>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100">
              <Bot className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <span className="text-base font-semibold text-zinc-900">
                {modalTitle}
              </span>
              {isDirty && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
                  有未保存的更改
                </span>
              )}
            </div>
          </div>
        }
        size="xl"
        footer={
          <div className="flex w-full items-center justify-between">
            <button
              ref={cancelRef}
              onClick={closeModal}
              disabled={saving || testResult.status === "testing"}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              取消
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTest}
                disabled={
                  !formData.apiUrl ||
                  !formData.apiKey ||
                  testResult.status === "testing" ||
                  saving
                }
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {testResult.status === "testing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : testResult.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : testResult.status === "error" ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
                测试连接
              </button>

              <button
                onClick={() => void handleSave()}
                disabled={!formData.name.trim() || !formData.apiUrl || saving}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                保存
              </button>
            </div>
          </div>
        }
      >
        {renderFormContent()}
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
        title="删除 AI 配置"
        message="确定要删除这个 AI 配置吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
