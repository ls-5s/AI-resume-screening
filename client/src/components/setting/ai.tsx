import { useState, useEffect } from "react";
import { getAiConfigs, createAiConfig, updateAiConfig, deleteAiConfig, testAiConfig } from "../../api/ai";
import type { AiConfig, UpdateAiConfigData, CreateAiConfigData } from "../../types/ai";
import { Bot, Save, X, Pencil, Globe, Key, FileText, Plus, Trash2, Star, StarOff, Loader2 } from "lucide-react";
import toast from "../../utils/toast";

// 常用的 AI 模型选项（仅供参考）
const AI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "deepseek-chat", label: "DeepSeek Chat" },
];

// 常用 API 地址
const API_URLS = [
  { value: "https://api.openai.com/v1", label: "OpenAI" },
  { value: "https://api.anthropic.com", label: "Anthropic (Claude)" },
  { value: "https://api.deepseek.com/v1", label: "DeepSeek" },
  { value: "https://api.moonshot.cn/v1", label: "月之暗面 (Moonshot)" },
  { value: "https://dashscope.aliyuncs.com/compatible-mode/v1", label: "阿里云 (DashScope)" },
];

// 默认提示词
const DEFAULT_PROMPT = `你是一个专业的简历筛选助手。请根据以下简历内容，评估候选人是否符合岗位要求。

岗位要求：
{job_requirements}

简历内容：
{resume_content}

请从以下几个方面进行评估：
1. 教育背景
2. 工作经历
3. 技能匹配度
4. 项目经验

请给出评估结果和建议。`;

interface EditingConfig {
  id?: number;
  name: string;
  model: string;
  apiUrl: string;
  apiKey: string;
  prompt: string;
  isDefault: boolean;
}

const emptyConfig: EditingConfig = {
  name: "",
  model: "gpt-4o",
  apiUrl: "https://api.openai.com/v1",
  apiKey: "",
  prompt: DEFAULT_PROMPT,
  isDefault: false,
};

export function AiSettings() {
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EditingConfig>(emptyConfig);
  const [showApiKey, setShowApiKey] = useState(false);

  // 加载 AI 配置列表
  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await getAiConfigs();
      setConfigs(data);
    } catch (error) {
      console.error("加载 AI 配置列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  // 新增配置
  const handleAdd = () => {
    setFormData(emptyConfig);
    setIsAdding(true);
    setEditingId(null);
  };

  // 编辑配置
  const handleEdit = (config: AiConfig) => {
    setFormData({
      id: config.id || undefined,
      name: config.name,
      model: config.model,
      apiUrl: config.apiUrl,
      apiKey: config.apiKey || "",
      prompt: config.prompt || DEFAULT_PROMPT,
      isDefault: config.isDefault,
    });
    setEditingId(config.id || null);
    setIsAdding(false);
  };

  // 取消编辑
  const handleCancel = () => {
    setFormData(emptyConfig);
    setIsAdding(false);
    setEditingId(null);
  };

  // 保存配置
  const handleSave = async () => {
    if (!formData.name.trim()) {
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
        name: formData.name,
        model: formData.model,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey || undefined,
        prompt: formData.prompt || DEFAULT_PROMPT,
        isDefault: formData.isDefault,
      };

      if (editingId) {
        await updateAiConfig(editingId, data);
        toast.success("配置更新成功");
      } else {
        await createAiConfig(data as CreateAiConfigData);
        toast.success("配置添加成功");
      }

      handleCancel();
      loadConfigs();
    } catch (error) {
      console.error("保存 AI 配置失败:", error);
      toast.error("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  // 删除配置
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个 AI 配置吗？")) {
      return;
    }

    try {
      await deleteAiConfig(id);
      toast.success("配置删除成功");
      loadConfigs();
    } catch (error) {
      console.error("删除 AI 配置失败:", error);
      toast.error("删除失败，请稍后重试");
    }
  };

  // 设置默认配置
  const handleSetDefault = async (id: number) => {
    try {
      await updateAiConfig(id, { isDefault: true });
      toast.success("已设为默认配置");
      loadConfigs();
    } catch (error) {
      console.error("设置默认配置失败:", error);
      toast.error("设置失败，请稍后重试");
    }
  };

  // 测试 AI 配置
  const handleTest = async () => {
    if (!formData.apiUrl) {
      toast.error("请输入 API 地址");
      return;
    }
    if (!formData.apiKey) {
      toast.error("请输入 API Key");
      return;
    }

    setTesting(true);
    try {
      const result = await testAiConfig({
        model: formData.model,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey,
      });
      if (result.success) {
        toast.success("连接成功");
      } else {
        toast.error(result.message || "连接失败");
      }
    } catch (error) {
      console.error("测试 AI 配置失败:", error);
      toast.error("测试失败，请检查配置");
    } finally {
      setTesting(false);
    }
  };

  // 渲染表单
  const renderForm = () => (
    <div className="bg-sky-50/60 rounded-2xl border border-sky-100/70 p-5 space-y-4">
      {/* 配置名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          配置名称
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="例如：OpenAI GPT-4"
        />
      </div>

      {/* AI 模型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Bot className="w-4 h-4 inline-block mr-1" />
          AI 模型
        </label>
        <input
          type="text"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="例如：gpt-4o, claude-3-opus, deepseek-chat"
        />
        <p className="text-xs text-gray-400 mt-1">
          常用模型：{AI_MODELS.map(m => m.value).join('、')}
        </p>
      </div>

      {/* API 地址 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Globe className="w-4 h-4 inline-block mr-1" />
          API 地址
        </label>
        <input
          type="text"
          value={formData.apiUrl}
          onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://api.openai.com/v1"
        />
        <p className="text-xs text-gray-400 mt-1">
          常用：{API_URLS.map(u => `${u.label} (${u.value})`).join('， ')}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          支持 OpenAI、Claude、DeepSeek 等兼容 OpenAI API 格式的模型
        </p>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Key className="w-4 h-4 inline-block mr-1" />
          API Key
        </label>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            placeholder="请输入 API Key"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showApiKey ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* AI 提示词 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <FileText className="w-4 h-4 inline-block mr-1" />
          AI 提示词
        </label>
        <textarea
          value={formData.prompt}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="请输入 AI 提示词"
          rows={8}
        />
        <p className="text-xs text-gray-400 mt-1">
          可用变量：{"{job_requirements}"} 岗位要求，{"{resume_content}"} 简历内容
        </p>
      </div>

      {/* 设为默认 */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
          className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isDefault" className="text-sm text-gray-700">
          设为默认配置
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={handleCancel}
          disabled={saving || testing}
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          取消
        </button>
        <button
          onClick={handleTest}
          disabled={testing || saving}
          className="rounded-2xl border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              测试中...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              测试连接
            </>
          )}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-linear-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              保存
            </>
          )}
        </button>
      </div>
    </div>
  );

  // 渲染配置卡片
  const renderConfigCard = (config: AiConfig) => (
    <div
      key={config.id}
      className={`bg-white rounded-2xl border p-4 ${
        config.isDefault ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900">{config.name}</h3>
            {config.isDefault && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-600 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                默认
              </span>
            )}
          </div>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <p>
              <span className="font-medium">模型：</span>
              {config.model}
            </p>
            <p>
              <span className="font-medium">API：</span>
              {config.apiUrl}
            </p>
            {config.prompt && (
              <p className="truncate max-w-xs">
                <span className="font-medium">提示词：</span>
                {config.prompt.substring(0, 50)}...
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-4">
          {!config.isDefault && (
            <button
              onClick={() => handleSetDefault(config.id!)}
              className="p-1.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 rounded transition-colors"
              title="设为默认"
            >
              <StarOff className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleEdit(config)}
            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
            title="编辑"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(config.id!)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/3 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">AI 配置</h2>
          <p className="text-sm text-zinc-500 mt-1">配置多个 AI 模型用于简历筛选</p>
        </div>
        {!isAdding && editingId === null && (
          <button
            onClick={handleAdd}
            className="rounded-2xl bg-linear-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加配置
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">加载中...</div>
      ) : isAdding || editingId !== null ? (
        /* 添加/编辑表单 */
        renderForm()
      ) : (
        /* 配置列表 */
        <div className="space-y-3">
          {configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bot className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>暂无 AI 配置</p>
              <p className="text-sm mt-1">点击上方"添加配置"创建第一个 AI 配置</p>
            </div>
          ) : (
            configs.map(renderConfigCard)
          )}
        </div>
      )}
    </div>
  );
}
