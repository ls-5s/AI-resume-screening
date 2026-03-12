import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Upload, Mail, Search, Filter } from 'lucide-react';
import { getResumes, uploadResume, deleteResume, getResume, importResumesFromEmail } from '../../api/resume';
import { getEmailConfigs } from '../../api/email';
import { logActivity } from '../../api/dashboard';
import type { Resume } from '../../types/resume';
import type { EmailConfig } from '../../types/email';
import {
  ResumeList,
  ResumeModal,
  ResumeDetailDrawer,
  PdfPreviewModal,
} from '../../components/resumes';

type ResumeStatus = 'all' | 'pending' | 'passed' | 'rejected';

export default function Resumes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewResume, setViewResume] = useState<Resume | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; fileName: string } | null>(null);

  // 根据 URL 参数自动打开上传弹窗
  useEffect(() => {
    if (searchParams.get('action') === 'upload') {
      setShowModal(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // 筛选和搜索状态
  const [statusFilter, setStatusFilter] = useState<ResumeStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 从邮箱导入相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

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
      await logActivity({
        type: 'upload',
        description: `从邮箱导入 ${result.imported} 份简历`,
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
      const data = await uploadResume({
        file: selectedFile,
        name: selectedFile.name.replace(/\.(pdf|docx|doc)$/i, ''),
      });
      await logActivity({ type: 'upload', resumeId: data.id, resumeName: data.name });
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
        />
      </div>

      {/* 上传弹窗 */}
      <ResumeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedFile(null);
        }}
        type="upload"
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
      <ResumeModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedConfigId(null);
        }}
        type="import"
        emailConfigs={emailConfigs}
        loadingConfigs={loadingConfigs}
        selectedConfigId={selectedConfigId}
        onConfigChange={setSelectedConfigId}
        onImport={handleImportFromEmail}
        importing={importing}
      />

    </div>
  );
}
