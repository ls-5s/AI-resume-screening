import { Loader2, FileText, Eye, Trash2, Mail, Phone, Calendar, HardDrive, Check, CheckCircle } from 'lucide-react';
import type { Resume } from '../../types/resume';
import { formatFileSize, formatDate } from '../../utils/format';

interface ResumeListProps {
  resumes: Resume[];
  loading: boolean;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  selectedIds?: number[];
  onSelectionChange?: (ids: number[]) => void;
  selectable?: boolean;
}

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

// 处理单个简历的选择
const handleResumeSelect = (resumeId: number, currentSelected: number[], onChange?: (ids: number[]) => void) => {
  if (!onChange) return;
  
  if (currentSelected.includes(resumeId)) {
    onChange(currentSelected.filter(id => id !== resumeId));
  } else {
    onChange([...currentSelected, resumeId]);
  }
};

// 处理全选
const handleSelectAll = (resumeIds: number[], currentSelected: number[], onChange?: (ids: number[]) => void) => {
  if (!onChange) return;
  
  // 如果已全部选中，则取消全选；否则全选
  const allSelected = resumeIds.every(id => currentSelected.includes(id));
  if (allSelected) {
    onChange([]);
  } else {
    onChange(resumeIds);
  }
};

export function ResumeList({ resumes, loading, onView, onDelete, selectedIds = [], onSelectionChange, selectable = false }: ResumeListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-slate-400" size={36} />
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="text-slate-400" size={36} />
        </div>
        <p className="text-slate-500 text-lg font-medium">暂无简历数据</p>
        <p className="text-slate-400 text-sm mt-1">上传或从邮箱导入简历开始筛选</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {/* 全选行 */}
      {selectable && resumes.length > 0 && (
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <button
            onClick={() => handleSelectAll(resumes.map(r => r.id), selectedIds, onSelectionChange)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            {resumes.length > 0 && resumes.every(r => selectedIds.includes(r.id)) ? (
              <CheckCircle className="w-5 h-5 text-purple-600" />
            ) : (
              <div className="w-5 h-5 border-2 border-slate-300 rounded" />
            )}
            <span>全选</span>
          </button>
          <span className="text-sm text-slate-400">
            已选 {selectedIds.length} / {resumes.length} 项
          </span>
        </div>
      )}
      {resumes.map((resume) => (
        <div 
          key={resume.id} 
          className="p-5 hover:bg-slate-50 transition-all duration-200 group"
        >
          <div className="flex items-start gap-4">
            {/* 选择框 */}
            {selectable && (
              <button
                onClick={() => handleResumeSelect(resume.id, selectedIds, onSelectionChange)}
                className="mt-2 flex-shrink-0"
              >
                {selectedIds.includes(resume.id) ? (
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-slate-300 rounded hover:border-purple-400" />
                )}
              </button>
            )}
            {/* 文件图标 */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <FileText className="text-white" size={24} />
            </div>

            {/* 主内容区域 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-slate-900 text-lg truncate">
                  {resume.name}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[resume.status]}`}>
                  {statusLabels[resume.status]}
                </span>
              </div>

              {/* 联系信息 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mb-3">
                {resume.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate max-w-[200px]">{resume.email}</span>
                  </div>
                )}
                {resume.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={14} className="text-slate-400" />
                    <span>{resume.phone}</span>
                  </div>
                )}
              </div>

              {/* 元信息 */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <HardDrive size={12} />
                  <span>{resume.fileType?.toUpperCase()}</span>
                  <span>·</span>
                  <span>{formatFileSize(resume.fileSize || 0)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>{formatDate(resume.createdAt)}</span>
                </div>
                {resume.originalFileName && (
                  <span className="truncate max-w-[150px]" title={resume.originalFileName}>
                    · {resume.originalFileName}
                  </span>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                aria-label="查看简历"
                onClick={() => onView(resume.id)}
                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                title="查看详情"
              >
                <Eye size={18} />
              </button>
              <button
                aria-label="删除简历"
                onClick={() => onDelete(resume.id)}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="删除"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* 摘要预览 */}
          {resume.summary && (
            <div className="mt-3 ml-16 pr-16">
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                {resume.summary}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
