import { useState, useEffect } from "react";
import { Modal, ConfirmModal } from "../../components/Modal";
import { 
  getEmailTemplates, 
  createEmailTemplate, 
  updateEmailTemplate, 
  deleteEmailTemplate,
  sendEmails
} from "../../api/email-template";
import { getEmailConfigs } from "../../api/email";
import type { EmailTemplate, CreateEmailTemplateData } from "../../types/email-template";
import type { EmailConfig } from "../../types/email";
import { Send, Plus, Edit, Trash2, Mail, Users } from "lucide-react";

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"templates" | "send">("templates");
  
  // 模板弹窗状态
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateFormData, setTemplateFormData] = useState<CreateEmailTemplateData>({
    name: "",
    subject: "",
    body: "",
  });
  
  // 删除确认弹窗
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; template: EmailTemplate | null }>({
    show: false,
    template: null,
  });
  
  // 发送邮件状态
  const [sendForm, setSendForm] = useState({
    templateId: 0,
    candidateIds: [] as number[],
    subject: "",
    body: "",
    fromEmailId: 0,
  });
  const [sending, setSending] = useState(false);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, configsData] = await Promise.all([
        getEmailTemplates(),
        getEmailConfigs(),
      ]);
      setTemplates(templatesData);
      setEmailConfigs(configsData);
      // 设置默认发件邮箱
      const defaultConfig = configsData.find(c => c.isDefault) || configsData[0];
      if (defaultConfig) {
        setSendForm(prev => ({ ...prev, fromEmailId: defaultConfig.id }));
      }
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 模板相关操作
  const openTemplateModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
      });
    } else {
      setEditingTemplate(null);
      setTemplateFormData({
        name: "",
        subject: "",
        body: "",
      });
    }
    setShowTemplateModal(true);
  };

  const closeTemplateModal = () => {
    setShowTemplateModal(false);
    setEditingTemplate(null);
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateEmailTemplate(editingTemplate.id, templateFormData);
      } else {
        await createEmailTemplate(templateFormData);
      }
      closeTemplateModal();
      loadData();
    } catch (error) {
      console.error("保存模板失败:", error);
      alert(error instanceof Error ? error.message : "保存失败");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteConfirm.template) return;
    try {
      await deleteEmailTemplate(deleteConfirm.template.id);
      setDeleteConfirm({ show: false, template: null });
      loadData();
    } catch (error) {
      console.error("删除模板失败:", error);
      alert(error instanceof Error ? error.message : "删除失败");
    }
  };

  // 选择模板时填充表单
  const handleSelectTemplate = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSendForm(prev => ({
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
      alert(result.message);
      // 重置表单
      setSendForm(prev => ({
        ...prev,
        candidateIds: [],
        subject: "",
        body: "",
      }));
    } catch (error) {
      console.error("发送邮件失败:", error);
      alert(error instanceof Error ? error.message : "发送失败");
    } finally {
      setSending(false);
    }
  };

  // 邮件变量提示
  const variables = [
    { key: "{{name}}", desc: "候选人姓名" },
    { key: "{{email}}", desc: "候选人邮箱" },
    { key: "{{phone}}", desc: "候选人电话" },
    { key: "{{position}}", desc: "应聘职位" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">邮件群发</h1>
      <p className="mt-2 text-gray-600">管理邮件模板并群发邮件给候选人</p>

      {/* 标签页切换 */}
      <div className="mt-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === "templates"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            邮件模板
          </span>
        </button>
        <button
          onClick={() => setActiveTab("send")}
          className={`pb-3 px-1 text-sm font-medium transition-colors ${
            activeTab === "send"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            发送邮件
          </span>
        </button>
      </div>

      {/* 邮件模板列表 */}
      {activeTab === "templates" && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">邮件模板</h2>
            <button
              onClick={() => openTemplateModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建模板
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-8">加载中...</div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无邮件模板</p>
              <p className="text-sm text-gray-400 mt-1">点击上方按钮创建第一个邮件模板</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">主题: {template.subject}</p>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{template.body}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openTemplateModal(template)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ show: true, template })}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 发送邮件表单 */}
      {activeTab === "send" && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：邮件内容 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">邮件内容</h2>
            
            <div className="space-y-4">
              {/* 选择模板 */}
              <div>
                <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1">
                  选择模板（可选）
                </label>
                <select
                  id="template-select"
                  value={sendForm.templateId}
                  onChange={(e) => handleSelectTemplate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>-- 选择模板 --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 邮件主题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮件主题
                </label>
                <input
                  type="text"
                  value={sendForm.subject}
                  onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入邮件主题"
                />
              </div>

              {/* 邮件正文 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮件正文
                </label>
                <textarea
                  value={sendForm.body}
                  onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="请输入邮件内容，支持变量替换"
                />
              </div>

              {/* 变量提示 */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">可用变量：</p>
                <div className="flex flex-wrap gap-2">
                  {variables.map((v) => (
                    <span
                      key={v.key}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                      onClick={() => setSendForm(prev => ({ ...prev, body: prev.body + v.key }))}
                      title="点击插入"
                    >
                      {v.key} ({v.desc})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：收件人和发件设置 */}
          <div className="space-y-6">
            {/* 发件设置 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">发件设置</h2>
              
              <div className="space-y-4">
                {/* 选择发件邮箱 */}
                <div>
                  <label htmlFor="from-email-select" className="block text-sm font-medium text-gray-700 mb-1">
                    发件邮箱
                  </label>
                  <select
                    id="from-email-select"
                    value={sendForm.fromEmailId}
                    onChange={(e) => setSendForm({ ...sendForm, fromEmailId: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value={0}>-- 选择发件邮箱 --</option>
                    {emailConfigs.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.email} {config.isDefault && "(默认)"}
                      </option>
                    ))}
                  </select>
                  {emailConfigs.length === 0 && (
                    <p className="mt-1 text-xs text-yellow-600">
                      暂无邮箱配置，请先在设置中添加邮箱
                    </p>
                  )}
                </div>

                {/* 收件人选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    收件人
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 min-h-[120px] bg-gray-50">
                    <p className="text-sm text-gray-500 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      候选人列表功能开发中...
                    </p>
                    {/* TODO: 后续接入候选人列表 */}
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      当前已选择: {sendForm.candidateIds.length} 人
                    </p>
                  </div>
                </div>

                {/* 发送按钮 */}
                <button
                  onClick={handleSend}
                  disabled={sending || emailConfigs.length === 0}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      发送中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      发送邮件
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 发送预览 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">预览</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600">主题：</span>
                  <span className="text-sm font-medium text-gray-900">{sendForm.subject || "（未填写）"}</span>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {sendForm.body || "（未填写）"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模板编辑弹窗 */}
      <Modal
        isOpen={showTemplateModal}
        onClose={closeTemplateModal}
        title={editingTemplate ? "编辑邮件模板" : "新建邮件模板"}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={closeTemplateModal}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              form="template-form"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </>
        }
      >
        <form id="template-form" onSubmit={handleTemplateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模板名称
            </label>
            <input
              type="text"
              value={templateFormData.name}
              onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：面试邀请模板"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮件主题
            </label>
            <input
              type="text"
              value={templateFormData.subject}
              onChange={(e) => setTemplateFormData({ ...templateFormData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：{{name}}，恭喜您通过初筛！"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮件正文
            </label>
            <textarea
              value={templateFormData.body}
              onChange={(e) => setTemplateFormData({ ...templateFormData, body: e.target.value })}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="尊敬的 {{name}} 您好：&#10;&#10;感谢您投递我们公司的 {{position}} 职位..."
              required
            />
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">提示：使用变量可以实现个性化内容，变量会在发送时自动替换</p>
            <div className="flex flex-wrap gap-2">
              {variables.map((v) => (
                <span
                  key={v.key}
                  className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600"
                >
                  {v.key} - {v.desc}
                </span>
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, template: null })}
        onConfirm={handleDeleteTemplate}
        title="删除模板"
        message={`确定要删除模板"${deleteConfirm.template?.name}"吗？此操作不可恢复。`}
        confirmText="删除"
        confirmVariant="danger"
      />
    </div>
  );
}
