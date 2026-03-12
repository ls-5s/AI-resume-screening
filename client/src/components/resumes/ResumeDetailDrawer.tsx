import { Loader2, FileText, Eye, Mail, Phone, Calendar, HardDrive, Download, Sparkles } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '../Drawer';
import type { Resume } from '../../types/resume';
import { formatFileSize, formatDate } from '../../utils/format';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// 状态颜色映射
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  passed: 'bg-green-100 text-green-700 border-green-200',
};

// 状态文本映射
const statusLabels = {
  pending: '待筛选',
  rejected: '已拒绝',
  passed: '已通过',
};

interface ResumeDetailDrawerProps {
  resume: Resume | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onPreview: (url: string, fileName: string) => void;
}

export function ResumeDetailDrawer({ resume, loading, onOpenChange, onPreview }: ResumeDetailDrawerProps) {
  const handlePreview = () => {
    if (!resume?.resumeFile) return;
    // 从完整路径中提取相对路径 (uploads/resumes/xxx.pdf)
    const fullPath = resume.resumeFile;
    const relativePath = fullPath.replace(/^.*[\\/]uploads[\\/]/, 'uploads/').replace(/\\/g, '/');
    const fileUrl = `${API_BASE_URL}/${relativePath}`;
    onPreview(fileUrl, resume.originalFileName || '简历');
  };

  return (
    <Drawer open={!!resume} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full max-w-3xl">
        <DrawerHeader>
          <DrawerTitle>简历详情</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-slate-400" size={36} />
            </div>
          ) : resume ? (
            <div className="space-y-6">
              {/* 头部信息卡片 */}
              <div className="bg-slate-800 text-white rounded-2xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <FileText className="text-white" size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{resume.name}</h2>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium border ${statusColors[resume.status]}`}>
                        {statusLabels[resume.status]}
                      </span>
                    </div>
                  </div>
                  {resume.resumeFile && (
                    <button
                      onClick={handlePreview}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                    >
                      <Eye size={18} />
                      查看原文件
                    </button>
                  )}
                </div>

                {/* 联系信息 */}
                <div className="mt-6 flex flex-wrap gap-6">
                  {resume.email && (
                    <div className="flex items-center gap-2 text-slate-200">
                      <Mail size={18} className="text-slate-400" />
                      <span>{resume.email}</span>
                    </div>
                  )}
                  {resume.phone && (
                    <div className="flex items-center gap-2 text-slate-200">
                      <Phone size={18} className="text-slate-400" />
                      <span>{resume.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 文件信息 */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <HardDrive size={16} className="text-slate-400" />
                  <span className="font-medium">文件类型:</span>
                  <span>{resume.fileType?.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Download size={16} className="text-slate-400" />
                  <span className="font-medium">文件大小:</span>
                  <span>{formatFileSize(resume.fileSize || 0)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="font-medium">上传时间:</span>
                  <span>{formatDate(resume.createdAt)}</span>
                </div>
                {resume.originalFileName && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText size={16} className="text-slate-400" />
                    <span className="font-medium">原始文件名:</span>
                    <span className="truncate max-w-[200px]">{resume.originalFileName}</span>
                  </div>
                )}
              </div>

              {/* AI 摘要 */}
              {resume.summary && (
                <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="text-blue-600" size={20} />
                    <h3 className="text-lg font-semibold text-slate-900">AI 解析摘要</h3>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {resume.summary}
                  </p>
                </div>
              )}

              {/* 简历完整内容 */}
              {resume.parsedContent && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                    <FileText size={18} className="text-slate-400" />
                    简历完整内容
                  </h3>
                  <div className="text-slate-700 whitespace-pre-wrap text-sm leading-7 max-h-[400px] overflow-y-auto">
                    {resume.parsedContent}
                  </div>
                </div>
              )}

              {/* 空状态 */}
              {!resume.summary && !resume.parsedContent && (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-xl">
                  <FileText className="mx-auto text-slate-300 mb-3" size={40} />
                  <p className="text-slate-500">暂无简历解析内容</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <FileText className="text-slate-300 mb-3" size={48} />
              <p className="text-slate-500">无法加载简历详情</p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
