import { useState, useEffect } from "react";
import { Modal } from "../../components/Modal";
import { 
  getEmailConfigs, 
  createEmailConfig, 
  updateEmailConfig, 
  deleteEmailConfig,
  testEmailConfig 
} from "../../api/email";
import type { EmailConfig, CreateEmailConfigData } from "../../types/email";

interface EmailConfigListProps {
  onRefresh?: () => void;
}

export function EmailConfigList({ onRefresh }: EmailConfigListProps) {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [formData, setFormData] = useState<CreateEmailConfigData>({
    email: "",
    authCode: "",
    imapHost: "imap.qq.com",
    imapPort: 993,
    smtpHost: "smtp.qq.com",
    smtpPort: 465,
    isDefault: false,
  });
  const [testingId, setTestingId] = useState<number | null>(null);

  // 加载邮箱配置列表
  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await getEmailConfigs();
      setConfigs(data);
    } catch (error) {
      console.error("加载邮箱配置失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  // 打开弹窗
  const openModal = (config?: EmailConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        email: config.email,
        authCode:config.authCode || "",
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
    setShowModal(true);
  };

  // 关闭弹窗
  const closeModal = () => {
    setShowModal(false);
    setEditingConfig(null);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingConfig) {
        await updateEmailConfig(editingConfig.id, formData);
      } else {
        await createEmailConfig(formData);
      }
      closeModal();
      loadConfigs();
      onRefresh?.();
    } catch (error) {
      console.error("保存邮箱配置失败:", error);
      alert(error instanceof Error ? error.message : "保存失败");
    }
  };

  // 测试邮箱配置
  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      await testEmailConfig(id);
      alert("测试邮件发送成功！");
    } catch (error) {
      console.error("测试失败:", error);
      alert(error instanceof Error ? error.message : "测试失败");
    } finally {
      setTestingId(null);
    }
  };

  // 删除邮箱配置
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除该邮箱配置吗？")) return;
    try {
      await deleteEmailConfig(id);
      loadConfigs();
      onRefresh?.();
    } catch (error) {
      console.error("删除邮箱配置失败:", error);
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] ring-1 ring-zinc-950/3 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
            邮箱配置
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            管理发件邮箱与 SMTP/IMAP 连接参数
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="rounded-2xl bg-linear-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-95 flex items-center gap-2"
        >
          添加邮箱
        </button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-500 py-14">加载中...</div>
      ) : configs.length === 0 ? (
        <div className="bg-sky-50/60 rounded-2xl border border-sky-100/70 p-10 text-center">
          <p className="text-zinc-500">暂无邮箱配置</p>
          <p className="text-sm text-zinc-400 mt-1">
            点击上方按钮添加第一个邮箱配置
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200/70"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900">
                    {config.email}
                  </span>
                  {config.isDefault && (
                    <span className="px-2 py-0.5 text-xs bg-sky-100 text-sky-700 rounded">
                      默认
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  IMAP: {config.imapHost}:{config.imapPort} | SMTP: {config.smtpHost}:{config.smtpPort}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTest(config.id)}
                  disabled={testingId === config.id}
                  className="rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingId === config.id ? "测试中..." : "测试"}
                </button>
                <button
                  onClick={() => openModal(config)}
                  className="rounded-2xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(config.id)}
                  className="rounded-2xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm transition-all hover:bg-red-50"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加/编辑邮箱弹窗 */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingConfig ? "编辑邮箱配置" : "添加邮箱配置"}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              form="email-config-form"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </>
        }
      >
        <form id="email-config-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱地址
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@qq.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              授权码 {editingConfig && "(留空则不修改)"}
            </label>
            <input
              type="password"
              value={formData.authCode}
              onChange={(e) => setFormData({ ...formData, authCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="邮箱授权码"
              required={!editingConfig}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IMAP 服务器
              </label>
              <input
                type="text"
                value={formData.imapHost}
                onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="imap.qq.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IMAP 端口
              </label>
              <input
                type="number"
                value={formData.imapPort}
                onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="993"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMTP 服务器
              </label>
              <input
                type="text"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="smtp.qq.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMTP 端口
              </label>
              <input
                type="number"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="465"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              设为默认发件邮箱
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
