import { useState, useEffect, useCallback } from "react";
import { Modal, ConfirmModal } from "../../components/Modal";
import { 
  getEmailConfigs, 
  createEmailConfig, 
  updateEmailConfig, 
  deleteEmailConfig,
  testEmailConfig 
} from "../../api/email";
import type { EmailConfig, CreateEmailConfigData } from "../../types/email";
import {
  Mail,
  Plus,
  Trash2,
  Star,
  StarOff,
  Inbox,
  Settings2,
  Shield,
  Zap,
  Globe,
  Hash,
  Send,
} from "lucide-react";
import toast from "../../utils/toast";
import {
  EmptyState,
  FormInput,
  PasswordInput,
  ToggleSwitch,
  CardGrid,
  AnimatedCard,
} from "../ui";
import { SettingSkeleton } from "./SettingSkeleton";

// ============================================================================
// Types
// ============================================================================

interface EmailConfigListProps {
  onRefresh?: () => void;
}

interface EmailFormData extends CreateEmailConfigData {
  id?: number;
}

// ============================================================================
// Email Provider Detection & Styling
// ============================================================================

interface ProviderStyle {
  gradient: string;
  badge: string;
  provider: string;
}

const EMAIL_PROVIDERS: Record<string, ProviderStyle> = {
  "qq.com": {
    gradient: "from-orange-500 to-red-500",
    badge: "bg-orange-100 text-orange-700",
    provider: "QQ邮箱",
  },
  "163.com": {
    gradient: "from-emerald-500 to-teal-500",
    badge: "bg-emerald-100 text-emerald-700",
    provider: "163邮箱",
  },
  "126.com": {
    gradient: "from-cyan-500 to-blue-500",
    badge: "bg-cyan-100 text-cyan-700",
    provider: "126邮箱",
  },
  "gmail.com": {
    gradient: "from-red-500 to-yellow-500",
    badge: "bg-red-100 text-red-700",
    provider: "Gmail",
  },
  "outlook.com": {
    gradient: "from-blue-500 to-indigo-500",
    badge: "bg-blue-100 text-blue-700",
    provider: "Outlook",
  },
  "foxmail.com": {
    gradient: "from-purple-500 to-pink-500",
    badge: "bg-purple-100 text-purple-700",
    provider: "Foxmail",
  },
  default: {
    gradient: "from-violet-500 to-purple-500",
    badge: "bg-violet-100 text-violet-700",
    provider: "企业邮箱",
  },
};

const getProviderStyle = (email: string): ProviderStyle => {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  for (const [key, style] of Object.entries(EMAIL_PROVIDERS)) {
    if (domain.includes(key)) return style;
  }
  return EMAIL_PROVIDERS.default;
};

// ============================================================================
// Email Card Component
// ============================================================================

const EmailCard = ({
  config,
  onEdit,
  onDelete,
  onTest,
  onSetDefault,
  testingId,
}: {
  config: EmailConfig;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onSetDefault: () => void;
  testingId: number | null;
}) => {
  const provider = getProviderStyle(config.email);
  const isTesting = testingId !== null && testingId === config.id;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-white shadow-sm transition-all duration-300 hover:border-zinc-300/80 hover:shadow-xl hover:-translate-y-1">
      {/* Gradient top accent */}
      <div className={`h-1.5 w-full bg-linear-to-r ${provider.gradient}`} />
      
      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${provider.gradient} shadow-lg`}>
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-semibold text-zinc-900">{config.email}</h3>
                {config.isDefault && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-linear-to-r from-amber-100 to-orange-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200/60">
                    <Star className="h-2.5 w-2.5 fill-amber-500" />
                    默认
                  </span>
                )}
              </div>
              <span className={`mt-0.5 inline-block rounded-md ${provider.badge} px-1.5 py-0.5 text-[10px] font-medium`}>
                {provider.provider}
              </span>
            </div>
          </div>
        </div>

        {/* Server Info */}
        <div className="mb-4 space-y-2 rounded-2xl bg-zinc-50/80 p-3.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-sm">
                <Inbox className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <span className="font-medium text-zinc-700">IMAP</span>
            </div>
            <code className="rounded bg-white px-2 py-0.5 font-mono text-zinc-500 shadow-sm">
              {config.imapHost}:{config.imapPort}
            </code>
          </div>
          <div className="h-px bg-zinc-200/60" />
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-sm">
                <Send className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <span className="font-medium text-zinc-700">SMTP</span>
            </div>
            <code className="rounded bg-white px-2 py-0.5 font-mono text-zinc-500 shadow-sm">
              {config.smtpHost}:{config.smtpPort}
            </code>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-zinc-100 pt-3.5">
          <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {!config.isDefault && (
              <button
                onClick={onSetDefault}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:bg-amber-50 hover:text-amber-600"
                title="设为默认"
              >
                <StarOff className="h-3.5 w-3.5" />
                <span>设为默认</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onTest}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-emerald-600 transition-all hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTesting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Zap className="h-3.5 w-3.5" />
              )}
              <span>{isTesting ? "测试中" : "测试"}</span>
            </button>
            
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-all hover:bg-sky-50 hover:text-sky-600"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>编辑</span>
            </button>
            
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-all hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>删除</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom gradient reveal on hover */}
      <div className={`h-0.5 w-0 bg-linear-to-r ${provider.gradient} transition-all duration-500 group-hover:w-full`} />
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function EmailConfigList({ onRefresh }: EmailConfigListProps) {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<EmailFormData>({
    email: "",
    authCode: "",
    imapHost: "imap.qq.com",
    imapPort: 993,
    smtpHost: "smtp.qq.com",
    smtpPort: 465,
    isDefault: false,
  });

  const isEditing = editingConfig !== null;

  // Load configs
  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmailConfigs();
      setConfigs(data);
    } catch (error) {
      console.error("加载邮箱配置失败:", error);
      toast.error("加载配置失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  // Open modal
  const openModal = (config?: EmailConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        id: config.id,
        email: config.email,
        authCode: config.authCode || "",
        imapHost: config.imapHost || "imap.qq.com",
        imapPort: config.imapPort || 993,
        smtpHost: config.smtpHost || "smtp.qq.com",
        smtpPort: config.smtpPort || 465,
        isDefault: config.isDefault || false,
      });
    } else {
      setEditingConfig(null);
      setFormData({
        email: "",
        authCode: "",
        imapHost: "imap.qq.com",
        imapPort: 993,
        smtpHost: "smtp.qq.com",
        smtpPort: 465,
        isDefault: false,
      });
    }
    setShowPassword(false);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingConfig(null);
  };

  // Update form field
  const updateField = <K extends keyof EmailFormData>(key: K, value: EmailFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.email) {
      toast.error("请输入邮箱地址");
      return;
    }
    if (!formData.authCode && !isEditing) {
      toast.error("请输入授权码");
      return;
    }

    try {
      const submitData = {
        email: formData.email,
        authCode: formData.authCode || undefined,
        imapHost: formData.imapHost,
        imapPort: formData.imapPort,
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        isDefault: formData.isDefault,
      };

      if (editingConfig) {
        await updateEmailConfig(editingConfig.id, submitData);
        toast.success("配置更新成功");
      } else {
        await createEmailConfig(submitData as CreateEmailConfigData);
        toast.success("配置添加成功");
      }
      
      closeModal();
      void loadConfigs();
      onRefresh?.();
    } catch (error) {
      console.error("保存邮箱配置失败:", error);
      toast.error(error instanceof Error ? error.message : "保存失败");
    }
  };

  // Test email config
  const handleTest = async (id: number) => {
    try {
      await testEmailConfig(id);
      toast.success("测试邮件发送成功！");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "测试失败");
    }
  };

  // Delete config
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteEmailConfig(deleteId);
      toast.success("配置删除成功");
      setDeleteId(null);
      void loadConfigs();
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  // Set default
  const handleSetDefault = async (id: number) => {
    try {
      await updateEmailConfig(id, { isDefault: true });
      toast.success("已设为默认邮箱");
      void loadConfigs();
    } catch (error) {
      toast.error("设置失败");
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/3">
      {/* Header */}
      <div className="border-b border-zinc-100 bg-linear-to-r from-zinc-50/50 via-white to-zinc-50/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">邮箱配置</h2>
              <p className="text-sm text-zinc-500">管理发件邮箱与 SMTP/IMAP 连接</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {configs.length > 0 && (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                {configs.length} 个配置
              </span>
            )}
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-sky-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              添加邮箱
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <SettingSkeleton rows={3} message="加载邮箱配置中..." />
        ) : configs.length === 0 ? (
          <EmptyState
            title="暂无邮箱配置"
            description="配置发件邮箱，开始自动化简历筛选与通知发送"
            actionLabel="添加第一个邮箱"
            onAction={() => openModal()}
            features={[
              { icon: Shield, text: "安全加密" },
              { icon: Zap, text: "快速配置" },
              { icon: Mail, text: "自动发送" },
            ]}
          />
        ) : (
          <CardGrid cols={3} gap="md">
            {configs.map((config, index) => (
              <AnimatedCard key={config.id} index={index}>
                <EmailCard
                  config={config}
                  onEdit={() => openModal(config)}
                  onDelete={() => setDeleteId(config.id!)}
                  onTest={() => handleTest(config.id)}
                  onSetDefault={() => handleSetDefault(config.id!)}
                  testingId={null}
                />
              </AnimatedCard>
            ))}
          </CardGrid>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-sky-500 to-blue-600">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold text-zinc-900">
              {isEditing ? "编辑邮箱配置" : "添加邮箱配置"}
            </span>
          </div>
        }
        size="lg"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <button
              onClick={closeModal}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-600 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              保存配置
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Basic info section */}
          <div className="rounded-2xl border border-zinc-100 bg-linear-to-b from-zinc-50/50 to-white p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-700">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-blue-600 shadow-sm">
                <Mail className="h-4 w-4 text-white" />
              </div>
              邮箱信息
            </div>
            <div className="space-y-4">
              <FormInput
                label="邮箱地址"
                icon={<Mail className="h-4 w-4" />}
                value={formData.email}
                onChange={(v) => updateField("email", v as string)}
                type="email"
                placeholder="example@qq.com"
                required
              />
              <PasswordInput
                label="授权码"
                icon={<Shield className="h-4 w-4" />}
                value={formData.authCode}
                onChange={(v) => updateField("authCode", v)}
                showPassword={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                hint={isEditing ? "留空则不修改当前授权码" : "请使用邮箱设置的授权码"}
                required={!isEditing}
              />
            </div>
          </div>

          {/* IMAP settings */}
          <div className="rounded-2xl border border-zinc-100 bg-linear-to-b from-zinc-50/50 to-white p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-700">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-blue-600 shadow-sm">
                <Inbox className="h-4 w-4 text-white" />
              </div>
              IMAP 接收设置
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="服务器"
                icon={<Globe className="h-4 w-4" />}
                value={formData.imapHost}
                onChange={(v) => updateField("imapHost", v as string)}
                placeholder="imap.qq.com"
              />
              <FormInput
                label="端口"
                icon={<Hash className="h-4 w-4" />}
                value={formData.imapPort}
                onChange={(v) => updateField("imapPort", v as number)}
                type="number"
                placeholder="993"
              />
            </div>
          </div>

          {/* SMTP settings */}
          <div className="rounded-2xl border border-zinc-100 bg-linear-to-b from-zinc-50/50 to-white p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-700">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-sky-500 to-blue-600 shadow-sm">
                <Send className="h-4 w-4 text-white" />
              </div>
              SMTP 发送设置
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                label="服务器"
                icon={<Globe className="h-4 w-4" />}
                value={formData.smtpHost}
                onChange={(v) => updateField("smtpHost", v as string)}
                placeholder="smtp.qq.com"
              />
              <FormInput
                label="端口"
                icon={<Hash className="h-4 w-4" />}
                value={formData.smtpPort}
                onChange={(v) => updateField("smtpPort", v as number)}
                type="number"
                placeholder="465"
              />
            </div>
          </div>

          {/* Default toggle */}
          <ToggleSwitch
            label="设为默认发件邮箱"
            description="简历通知将优先使用此邮箱发送"
            checked={formData.isDefault ?? false}
            onChange={(checked) => updateField("isDefault", checked)}
          />
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="删除邮箱配置"
        message="确定要删除这个邮箱配置吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
