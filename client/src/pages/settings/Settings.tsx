import { useState, useEffect } from "react";
import { 
  getEmailConfigs, 
  createEmailConfig, 
  updateEmailConfig, 
  deleteEmailConfig,
  testEmailConfig 
} from "../../api/email";
import type { EmailConfig, CreateEmailConfigData } from "../../types/email";

export default function Settings() {
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
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
  const loadEmailConfigs = async () => {
    setLoading(true);
    try {
      const data = await getEmailConfigs();
      setEmailConfigs(data);
    } catch (error) {
      console.error("加载邮箱配置失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmailConfigs();
  }, []);

  // 打开弹窗
  const openModal = (config?: EmailConfig) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        email: config.email,
        authCode: "",
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
      loadEmailConfigs();
    } catch (error) {
      console.error("保存邮箱配置失败:", error);
      alert(error instanceof Error ? error.message : "保存失败");
    }
  };

  // 删除配置
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除该邮箱配置吗？")) return;
    try {
      await deleteEmailConfig(id);
      loadEmailConfigs();
    } catch (error) {
      console.error("删除邮箱配置失败:", error);
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  // 测试配置
  const handleTest = async (id: number) => {
    setTestingId(id);
    try {
      const result = await testEmailConfig(id);
      alert(result.message);
    } catch (error) {
      console.error("测试邮箱配置失败:", error);
      alert(error instanceof Error ? error.message : "测试失败");
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">设置</h1>
      <p className="mt-2 text-gray-600">系统配置和个性化设置</p>

      <div className="mt-6 space-y-6">
        {/* 账户设置 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900">账户设置</h2>
          <p className="mt-2 text-gray-500">管理您的账户信息</p>
        </div>

        {/* 通知设置 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900">通知设置</h2>
          <p className="mt-2 text-gray-500">配置系统通知偏好</p>
        </div>

        {/* AI 配置 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900">AI 配置</h2>
          <p className="mt-2 text-gray-500">调整 AI 筛选参数</p>
        </div>

        {/* 邮箱配置 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">邮箱配置</h2>
              <p className="mt-2 text-gray-500">管理用于发送简历的邮箱配置</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加邮箱
            </button>
          </div>

          {/* 邮箱配置列表 */}
          {loading ? (
            <div className="mt-4 text-center text-gray-500">加载中...</div>
          ) : emailConfigs.length === 0 ? (
            <div className="mt-4 text-center text-gray-500">暂无邮箱配置</div>
          ) : (
            <div className="mt-4 space-y-3">
              {emailConfigs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{config.email}</span>
                      {config.isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          默认
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      IMAP: {config.imapHost}:{config.imapPort} | SMTP: {config.smtpHost}:{config.smtpPort}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTest(config.id)}
                      disabled={testingId === config.id}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      {testingId === config.id ? "测试中..." : "测试"}
                    </button>
                    <button
                      onClick={() => openModal(config)}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="px-3 py-1.5 text-sm text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑邮箱弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingConfig ? "编辑邮箱配置" : "添加邮箱配置"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
