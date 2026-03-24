import { useRef, useCallback, useState } from "react";
import {
  Upload,
  FileText,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle2,
  X,
  Inbox,
  File,
  FileCheck,
} from "lucide-react";
import { Modal } from "../Modal";
import { formatFileSize } from "../../utils/format";
import type { EmailConfig } from "../../types/email";

// ============================================================================
// Types
// ============================================================================

export type ResumeModalType = "upload" | "import";

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: ResumeModalType;
  selectedFile?: File | null;
  onFileChange?: (file: File | null) => void;
  onUpload?: () => void;
  uploading?: boolean;
  emailConfigs?: EmailConfig[];
  loadingConfigs?: boolean;
  selectedConfigId?: number | null;
  onConfigChange?: (id: number | null) => void;
  onImport?: () => void;
  importing?: boolean;
}

// ============================================================================
// Upload Section Components
// ============================================================================

interface DropZoneProps {
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const DropZone = ({ selectedFile, onFileChange, fileInputRef }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        onFileChange(file);
      }
    },
    [onFileChange]
  );

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-12 w-12" />;
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return <FileText className="h-12 w-12" />;
    }
    return <File className="h-12 w-12" />;
  };

  const getFileGradient = () => {
    if (!selectedFile) return "from-zinc-100 to-slate-200";
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "from-rose-500 to-red-600";
    if (ext === "docx") return "from-blue-500 to-indigo-600";
    return "from-violet-500 to-purple-600";
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border-2 border-dashed
        transition-all duration-300 cursor-pointer
        ${
          isDragging
            ? "border-violet-500 bg-violet-50/50"
            : selectedFile
            ? "border-violet-200 bg-violet-50/30"
            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50"
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={(e) => {
          const file = e.target.files?.[0];
          onFileChange(file || null);
        }}
        className="hidden"
        id="resume-upload"
      />
      <label htmlFor="resume-upload" className="cursor-pointer block">
        <div className="p-10 text-center">
          {selectedFile ? (
            <div className="space-y-4">
              {/* File Preview */}
              <div className="flex justify-center">
                <div
                  className={`
                    flex h-20 w-20 items-center justify-center rounded-2xl
                    bg-gradient-to-br ${getFileGradient()} shadow-lg
                  `}
                >
                  <div className="text-white">{getFileIcon()}</div>
                </div>
              </div>

              {/* File Info */}
              <div>
                <p className="text-base font-semibold text-zinc-900 mb-1">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-zinc-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>

              {/* Replace hint */}
              <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-violet-600 shadow-sm ring-1 ring-violet-100">
                <FileCheck className="h-4 w-4" />
                点击或拖拽更换文件
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload Icon */}
              <div className="flex justify-center">
                <div
                  className={`
                    flex h-20 w-20 items-center justify-center rounded-2xl
                    bg-gradient-to-br ${getFileGradient()} shadow-lg
                    transition-transform duration-300
                    ${isDragging ? "scale-110" : ""}
                  `}
                >
                  <Upload
                    className={`h-10 w-10 text-white transition-transform duration-300 ${
                      isDragging ? "scale-110" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Text Content */}
              <div>
                <p className="text-base font-semibold text-zinc-900 mb-2">
                  点击上传或拖拽文件到此处
                </p>
                <p className="text-sm text-zinc-500">
                  支持 PDF、Word 文档，最大 10MB
                </p>
              </div>

              {/* Supported formats */}
              <div className="flex justify-center gap-3 mt-4">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600">
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
                  <File className="h-3.5 w-3.5" />
                  DOCX
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600">
                  <File className="h-3.5 w-3.5" />
                  DOC
                </div>
              </div>
            </div>
          )}
        </div>
      </label>
    </div>
  );
};

// ============================================================================
// Import Section Components
// ============================================================================

interface ImportSectionProps {
  emailConfigs: EmailConfig[];
  loadingConfigs: boolean;
  selectedConfigId: number | null;
  onConfigChange: (id: number | null) => void;
  onImport: () => void;
  importing: boolean;
}

const ImportSection = ({
  emailConfigs,
  loadingConfigs,
  selectedConfigId,
  onConfigChange,
  onImport,
  importing,
}: ImportSectionProps) => {
  if (loadingConfigs) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
      </div>
    );
  }

  if (emailConfigs.length === 0) {
    return (
      <div className="space-y-6 py-6 text-center">
        {/* Empty State */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-zinc-100 to-slate-200 shadow-inner">
            <Inbox className="h-10 w-10 text-zinc-400" />
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-900">
            暂无邮箱配置
          </h3>
          <p className="text-sm text-zinc-500">
            请先在设置中添加邮箱配置后再导入简历
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Config Selection */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <Mail className="h-4 w-4 text-violet-500" />
          选择邮箱账号
        </label>
        <div className="relative">
          <select
            value={selectedConfigId || ""}
            onChange={(e) => onConfigChange(Number(e.target.value) || null)}
            className="
              w-full appearance-none rounded-xl border border-zinc-200
              bg-white px-4 py-3 text-sm text-zinc-900
              focus:border-violet-500 focus:outline-none focus:ring-2
              focus:ring-violet-500/20 transition-all
              cursor-pointer hover:border-zinc-300
            "
          >
            <option value="">请选择邮箱</option>
            {emailConfigs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.email}
              </option>
            ))}
          </select>
          {/* Custom dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
            <svg
              className="h-4 w-4 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
        {/* Background decoration */}
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-blue-200/30" />

        <div className="relative flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <AlertCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold text-zinc-900">
              导入说明
            </h4>
            <p className="text-sm leading-relaxed text-zinc-600">
              系统将自动扫描该邮箱最近{" "}
              <span className="font-semibold text-blue-600">7 天</span>{" "}
              的邮件，查找包含 PDF 或 Word 格式简历附件的邮件并导入。
            </p>
          </div>
        </div>
      </div>

      {/* Selected Config Preview */}
      {selectedConfigId && (
        <div className="rounded-xl bg-zinc-50 p-4">
          {(() => {
            const config = emailConfigs.find((c) => c.id === selectedConfigId);
            if (!config) return null;
            return (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {config.email}
                  </p>
                  <p className="text-xs text-zinc-500">
                    将从此邮箱导入简历附件
                  </p>
                </div>
                <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function ResumeModal({
  isOpen,
  onClose,
  type,
  selectedFile,
  onFileChange,
  onUpload,
  uploading,
  emailConfigs = [],
  loadingConfigs,
  selectedConfigId,
  onConfigChange,
  onImport,
  importing,
}: ResumeModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (type === "upload" && onFileChange) {
      onFileChange(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    onClose();
  };

  const isUpload = type === "upload";

  const getModalTitle = () => {
    if (isUpload) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Upload className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-base font-semibold text-zinc-900">
              上传简历
            </span>
            <p className="text-xs text-zinc-500">支持 PDF、Word 格式</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="text-base font-semibold text-zinc-900">
            从邮箱导入
          </span>
          <p className="text-xs text-zinc-500">自动扫描简历附件</p>
        </div>
      </div>
    );
  };

  const getSubmitButtonContent = () => {
    if (isUpload) {
      return (
        <>
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          {uploading ? "上传中..." : "开始上传"}
        </>
      );
    }
    return (
      <>
        {importing && <Loader2 className="h-4 w-4 animate-spin" />}
        {importing ? "导入中..." : "开始导入"}
      </>
    );
  };

  const isSubmitDisabled = isUpload
    ? !selectedFile || uploading
    : !selectedConfigId || importing || emailConfigs.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      size="md"
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="
              rounded-xl border border-zinc-200 bg-white px-5 py-2.5
              text-sm font-medium text-zinc-600
              hover:bg-zinc-50 hover:border-zinc-300
              transition-all disabled:opacity-50
            "
          >
            取消
          </button>
          <button
            onClick={isUpload ? onUpload : onImport}
            disabled={isSubmitDisabled}
            className="
              flex items-center gap-2 rounded-xl
              bg-gradient-to-r from-violet-600 to-purple-600
              px-5 py-2.5 text-sm font-semibold text-white
              shadow-lg shadow-violet-500/25
              hover:shadow-xl hover:shadow-violet-500/30 hover:brightness-105
              transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg
            "
          >
            {getSubmitButtonContent()}
          </button>
        </div>
      }
    >
      {isUpload ? (
        <DropZone
          selectedFile={selectedFile || null}
          onFileChange={onFileChange || (() => {})}
          fileInputRef={fileInputRef}
        />
      ) : (
        <ImportSection
          emailConfigs={emailConfigs}
          loadingConfigs={loadingConfigs || false}
          selectedConfigId={selectedConfigId || null}
          onConfigChange={onConfigChange || (() => {})}
          onImport={onImport || (() => {})}
          importing={importing || false}
        />
      )}
    </Modal>
  );
}
