import { useRef } from 'react';
import { Upload, FileText, Loader2, Mail, AlertCircle } from 'lucide-react';
import { Modal } from '../Modal';
import { formatFileSize } from '../../utils/format';
import type { EmailConfig } from '../../types/email';

export type ResumeModalType = 'upload' | 'import';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ResumeModalType;
  // 上传相关
  selectedFile?: File | null;
  onFileChange?: (file: File | null) => void;
  onUpload?: () => void;
  uploading?: boolean;
  // 导入相关
  emailConfigs?: EmailConfig[];
  loadingConfigs?: boolean;
  selectedConfigId?: number | null;
  onConfigChange?: (id: number | null) => void;
  onImport?: () => void;
  importing?: boolean;
}

export function ResumeModal({
  isOpen,
  onClose,
  type,
  selectedFile,
  onFileChange,
  onUpload,
  uploading,
  emailConfigs,
  loadingConfigs,
  selectedConfigId,
  onConfigChange,
  onImport,
  importing,
}: ResumeModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (type === 'upload' && onFileChange) {
      onFileChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    onClose();
  };

  const isUpload = type === 'upload';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isUpload ? '上传简历' : '从邮箱导入简历'}
      size="md"
      footer={
        isUpload ? (
          <>
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={onUpload}
              disabled={!selectedFile || uploading}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {uploading && <Loader2 className="animate-spin" size={18} />}
              {uploading ? '上传中...' : '上传简历'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={onImport}
              disabled={!selectedConfigId || importing || (emailConfigs?.length ?? 0) === 0}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {importing && <Loader2 className="animate-spin" size={18} />}
              {importing ? '导入中...' : '开始导入'}
            </button>
          </>
        )
      }
    >
      {isUpload ? (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onFileChange?.(file || null);
            }}
            className="hidden"
            id="resume-upload"
          />
          <label htmlFor="resume-upload" className="cursor-pointer block">
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-md">
                  <FileText className="text-white" size={32} />
                </div>
                <p className="text-slate-900 font-medium text-lg mb-1">{selectedFile.name}</p>
                <p className="text-slate-500 text-sm">
                  {formatFileSize(selectedFile.size)}
                </p>
                <p className="text-blue-600 text-sm mt-3 font-medium">点击更换文件</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-3">
                  <Upload className="text-slate-400" size={32} />
                </div>
                <p className="text-slate-600 font-medium">点击或拖拽文件到此处上传</p>
                <p className="text-slate-400 text-sm mt-2">支持 PDF、Word 文档，最大 10MB</p>
              </div>
            )}
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {loadingConfigs ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-slate-400" size={36} />
            </div>
          ) : (emailConfigs?.length ?? 0) === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-600 font-medium mb-2">暂无邮箱配置</p>
              <p className="text-sm text-slate-400">请先在设置中添加邮箱配置</p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="email-import-select" className="block text-sm font-medium text-slate-700 mb-2">
                  选择邮箱账号
                </label>
                <select
                  id="email-import-select"
                  value={selectedConfigId || ''}
                  onChange={(e) => onConfigChange?.(Number(e.target.value) || null)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 bg-white"
                >
                  <option value="">请选择邮箱</option>
                  {emailConfigs?.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-700 leading-relaxed">
                  系统将自动扫描该邮箱最近7天的邮件，查找包含 PDF 或 Word 格式简历附件的邮件并导入。
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
