import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Upload, Mail, Search, Filter, Bot, Sparkles } from 'lucide-react';
import { getResumes, uploadResume, deleteResume, getResume, importResumesFromEmail, batchUpdateResumeStatus } from '../../api/resume';
import { getEmailConfigs } from '../../api/email';
import { getAiConfigs, batchScreenResumesWithAi } from '../../api/ai';
import type { Resume } from '../../types/resume';
import type { EmailConfig } from '../../types/email';
import type { AiConfig } from '../../types/ai';
import {
  ResumeList,
  ResumeUploadModal,
  ResumeDetailDrawer,
  PdfPreviewModal,
  EmailImportModal,
} from '../../components/resumes';

type ResumeStatus = 'all' | 'pending' | 'passed' | 'rejected';

export default function Resumes() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewResume, setViewResume] = useState<Resume | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; fileName: string } | null>(null);

  // 筛选和搜索状态
  const [statusFilter, setStatusFilter] = useState<ResumeStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 从邮箱导入相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  // AI 筛选相关状态
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiConfigs, setAiConfigs] = useState<AiConfig[]>([]);
  const [selectedAiConfigId, setSelectedAiConfigId] = useState<number | null>(null);
  const [jobRequirements, setJobRequirements] = useState('');
  const [screening, setScreening] = useState(false);
  const [screeningResumeIds, setScreeningResumeIds] = useState<number[]>([]);

  // 加载简历列表
  const loadResumes = async () => {
    setLoading(true);
    try {
      const data = await getResumes();
      setResumes(data);
    } catch (error) {
      console.error('加载简历失败:', error);
      toast.error('加载简历失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  // 筛选后的简历
  const filteredResumes = useMemo(() => {
    return resumes.filter((resume) => {
      // 状态筛选
      if (statusFilter !== 'all' && resume.status !== statusFilter) {
        return false;
      }
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          resume.name.toLowerCase().includes(query) ||
          resume.email?.toLowerCase().includes(query) ||
          resume.phone?.includes(query) ||
          resume.summary?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [resumes, statusFilter, searchQuery]);

  // 统计各状态数量
  const stats = useMemo(() => {
    return {
      all: resumes.length,
      pending: resumes.filter((r) => r.status === 'pending').length,
      passed: resumes.filter((r) => r.status === 'passed').length,
      rejected: resumes.filter((r) => r.status === 'rejected').length,
    };
  }, [resumes]);

  // 加载邮箱配置列表
  const loadEmailConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const data = await getEmailConfigs();
      setEmailConfigs(data);
      // 默认选择第一个配置
      if (data.length > 0) {
        setSelectedConfigId(data[0].id);
      }
    } catch (error) {
      console.error('加载邮箱配置失败:', error);
      toast.error('加载邮箱配置失败');
    } finally {
      setLoadingConfigs(false);
    }
  };

  // 打开导入弹窗
  const handleOpenImportModal = async () => {
    setShowImportModal(true);
    await loadEmailConfigs();
  };

  // 从邮箱导入简历
  const handleImportFromEmail = async () => {
    if (!selectedConfigId) {
      toast.error('请选择邮箱配置');
      return;
    }

    setImporting(true);
    try {
      const result = await importResumesFromEmail({
        configId: selectedConfigId,
      });
      toast.success(`成功导入 ${result.imported} 份简历`);
      setShowImportModal(false);
      setSelectedConfigId(null);
      loadResumes();
    } catch (error) {
      console.error('从邮箱导入失败:', error);
      toast.error('从邮箱导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 加载 AI 配置列表
  const loadAiConfigs = async () => {
    try {
      const data = await getAiConfigs();
      setAiConfigs(data);
      // 默认选择第一个配置
      if (data.length > 0) {
        setSelectedAiConfigId(data[0].id);
      }
    } catch (error) {
      console.error('加载 AI 配置失败:', error);
      toast.error('加载 AI 配置失败');
    }
  };

  // 打开 AI 筛选弹窗
  const handleOpenAiModal = async () => {
    setShowAiModal(true);
    await loadAiConfigs();
  };

  // AI 筛选简历
  const handleAiScreen = async () => {
    if (!jobRequirements.trim()) {
      toast.error('请输入岗位要求');
      return;
    }

    if (screeningResumeIds.length === 0) {
      toast.error('请选择要筛选的简历');
      return;
    }

    setScreening(true);
    try {
      const result = await batchScreenResumesWithAi({
        resumeIds: screeningResumeIds,
        jobRequirements: jobRequirements,
        aiConfigId: selectedAiConfigId || undefined,
      });

      // 处理筛选结果并更新简历状态
      const passedIds: number[] = [];
      const rejectedIds: number[] = [];
      let failed = 0;

      result.forEach((r) => {
        if (r.success && r.result) {
          if (r.result.recommendation === 'pass') {
            passedIds.push(r.resumeId);
          } else if (r.result.recommendation === 'reject') {
            rejectedIds.push(r.resumeId);
          }
        } else {
          failed++;
        }
      });

      // 批量更新通过的简历状态
      if (passedIds.length > 0) {
        await batchUpdateResumeStatus(passedIds, 'passed');
      }

      // 批量更新拒绝的简历状态
      if (rejectedIds.length > 0) {
        await batchUpdateResumeStatus(rejectedIds, 'rejected');
      }

      toast.success(`筛选完成：通过 ${passedIds.length}份，拒绝 ${rejectedIds.length}份${failed > 0 ? `，失败 ${failed}份` : ''}`);
      setShowAiModal(false);
      setScreeningResumeIds([]);
      setJobRequirements('');
      loadResumes();
    } catch (error) {
      console.error('AI 筛选失败:', error);
      toast.error('AI 筛选失败');
    } finally {
      setScreening(false);
    }
  };

  // 处理文件选择
  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type)) {
      toast.error('只支持 PDF、Word 文档');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过 10MB');
      return;
    }
    setSelectedFile(file);
  };

  // 上传简历
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('请选择文件');
      return;
    }

    setUploading(true);
    try {
      await uploadResume({
        file: selectedFile,
        name: selectedFile.name.replace(/\.(pdf|docx|doc)$/i, ''),
      });
      toast.success('上传成功');
      setShowModal(false);
      setSelectedFile(null);
      loadResumes();
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 删除简历
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这份简历吗？')) return;

    try {
      await deleteResume(id);
      toast.success('删除成功');
      loadResumes();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  // 查看简历详情
  const handleView = async (id: number) => {
    setViewLoading(true);
    try {
      const data = await getResume(id);
      setViewResume(data);
    } catch (error) {
      console.error('获取简历详情失败:', error);
      toast.error('获取简历详情失败');
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">简历管理</h1>
      <p className="mt-2 text-gray-600">管理所有投递的简历</p>

      {/* 统计卡片 */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            statusFilter === 'all'
              ? 'border-slate-800 bg-slate-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-500">全部简历</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.all}</p>
        </button>
        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            statusFilter === 'pending'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-500">待筛选</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
        </button>
        <button
          onClick={() => setStatusFilter('passed')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            statusFilter === 'passed'
              ? 'border-green-500 bg-green-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-500">已通过</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.passed}</p>
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            statusFilter === 'rejected'
              ? 'border-red-500 bg-red-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="text-sm text-slate-500">已拒绝</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="mt-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="搜索简历姓名、邮箱、 phone 或内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <span className="text-sm text-slate-600">
              共 {filteredResumes.length} 份简历
              {statusFilter !== 'all' && (
                <span className="ml-1">
                  (筛选自 {resumes.length} 份)
                </span>
              )}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleOpenAiModal}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Bot size={18} />
              AI 筛选
            </button>
            <button
              onClick={handleOpenImportModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Mail size={18} />
              从邮箱导入
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Upload size={18} />
              上传简历
            </button>
          </div>
        </div>

        <ResumeList
          resumes={filteredResumes}
          loading={loading}
          onView={handleView}
          onDelete={handleDelete}
          selectable={true}
          selectedIds={screeningResumeIds}
          onSelectionChange={setScreeningResumeIds}
        />
      </div>

      {/* 上传弹窗 */}
      <ResumeUploadModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedFile(null);
        }}
        selectedFile={selectedFile}
        onFileChange={handleFileChange}
        onUpload={handleUpload}
        uploading={uploading}
      />

      {/* 查看简历详情抽屉 */}
      <ResumeDetailDrawer
        resume={viewResume}
        loading={viewLoading}
        onOpenChange={(open) => !open && setViewResume(null)}
        onPreview={(url, fileName) => setPdfPreview({ url, fileName })}
      />

      {/* PDF 预览模态框 */}
      <PdfPreviewModal
        isOpen={!!pdfPreview}
        onClose={() => setPdfPreview(null)}
        url={pdfPreview?.url || null}
        fileName={pdfPreview?.fileName || null}
      />

      {/* 从邮箱导入弹窗 */}
      <EmailImportModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedConfigId(null);
        }}
        emailConfigs={emailConfigs}
        loadingConfigs={loadingConfigs}
        selectedConfigId={selectedConfigId}
        onConfigChange={setSelectedConfigId}
        onImport={handleImportFromEmail}
        importing={importing}
      />

      {/* AI 筛选弹窗 */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !screening && setShowAiModal(false)}
          />

          {/* 弹窗内容 */}
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">AI 简历筛选</h3>
                </div>
                <button
                  onClick={() => !screening && setShowAiModal(false)}
                  disabled={screening}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="关闭"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* AI 配置选择 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择 AI 配置
                </label>
                <select
                  value={selectedAiConfigId || ''}
                  onChange={(e) => setSelectedAiConfigId(Number(e.target.value))}
                  disabled={screening}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  title="选择 AI 配置"
                >
                  {aiConfigs.length === 0 ? (
                    <option value="">暂无 AI 配置</option>
                  ) : (
                    aiConfigs.map((config) => (
                      <option key={config.id} value={config.id!}>
                        {config.name} ({config.model})
                      </option>
                    ))
                  )}
                </select>
                {aiConfigs.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    请先在设置页面配置 AI
                  </p>
                )}
              </div>

              {/* 岗位要求输入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  岗位要求
                </label>
                <textarea
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  disabled={screening}
                  placeholder="请输入岗位要求，例如：&#10;1. 计算机相关专业本科及以上学历&#10;2. 3年以上前端开发经验&#10;3. 熟悉 React、Vue 等主流框架&#10;4. 具备良好的代码规范和团队协作能力"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={6}
                />
              </div>

              {/* 已选简历数量 */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">已选简历数量</span>
                  <span className="text-sm font-medium text-purple-600">
                    {screeningResumeIds.length} 份
                  </span>
                </div>
                {screeningResumeIds.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    请在简历列表中勾选要筛选的简历
                  </p>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAiModal(false)}
                  disabled={screening}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAiScreen}
                  disabled={screening || aiConfigs.length === 0 || !jobRequirements.trim() || screeningResumeIds.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {screening ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      筛选中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      开始筛选
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
