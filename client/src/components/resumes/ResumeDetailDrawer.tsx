import { Loader2, FileText, Eye, Calendar, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../Drawer";
import type { Resume } from "../../types/resume";
import { formatDate, formatRelativeTime } from "../../utils/format";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ============================================================================
// Types & Constants
// ============================================================================

interface ResumeDetailDrawerProps {
  resume: Resume | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Parsed Content Card Component
// ============================================================================

const ParsedContentCard = ({
  content,
  onOpenOriginal,
  resume,
}: {
  content: string;
  onOpenOriginal: () => void;
  resume: Resume;
}) => (
  <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
    <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-200">
          <FileCheck className="h-4 w-4 text-zinc-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">简历完整内容</h3>
          <p className="text-xs text-zinc-500">OCR 识别后的文本内容</p>
        </div>
      </div>
      {resume.resumeFile && (
        <button
          type="button"
          title="在新标签页打开"
          onClick={onOpenOriginal}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-zinc-200/50 transition-all hover:bg-zinc-50 hover:shadow-md"
        >
          <Eye className="h-4 w-4" />
          查看原文件
        </button>
      )}
    </div>
    <div className="p-6">
      <pre className="text-sm leading-7 text-zinc-700 whitespace-pre-wrap font-simplified max-h-[400px] overflow-y-auto">
        {content}
      </pre>
    </div>
  </div>
);

// ============================================================================
// Empty Content State
// ============================================================================

const EmptyContent = () => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 py-16 px-8">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
      <FileText className="h-8 w-8 text-zinc-400" />
    </div>
    <h4 className="mb-2 text-base font-medium text-zinc-700">
      暂无简历解析内容
    </h4>
    <p className="text-sm text-zinc-500 text-center max-w-sm">
      系统将在 AI 分析完成后自动生成简历摘要和完整内容
    </p>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export function ResumeDetailDrawer({
  resume,
  loading,
  onOpenChange,
}: ResumeDetailDrawerProps) {
  const handleOpenOriginalFile = () => {
    if (!resume?.resumeFile) return;
    const fullPath = resume.resumeFile;
    const relativePath = fullPath
      .replace(/^.*[\\/]uploads[\\/]/, "uploads/")
      .replace(/\\/g, "/");
    const fileUrl = `${API_BASE_URL}/${relativePath}`;
    const opened = window.open(fileUrl, "_blank", "noopener,noreferrer");
    if (!opened) {
      toast.error("无法打开新窗口，请检查浏览器是否拦截了弹窗");
    }
  };

  const hasContent = !!resume?.parsedContent;

  return (
    <Drawer open={!!resume} onOpenChange={onOpenChange}>
      <DrawerContent className="w-full max-w-3xl">
        <DrawerHeader className="sr-only">
          <DrawerTitle>简历详情</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
              </div>
            </div>
          ) : resume ? (
            <div className="p-6 space-y-6">
              {/* Profile Header：仅姓名 + 上传时间 */}
              <div
                className="
                  relative overflow-hidden rounded-2xl border border-transparent
                  bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6
                "
              >
                <div
                  className="
                    absolute -right-12 -top-12 h-40 w-40 rounded-full
                    bg-gradient-to-br from-violet-500 to-purple-600
                    opacity-20 blur-3xl
                  "
                />
                <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-violet-500/10" />

                <div className="relative min-w-0">
                  <h2 className="text-2xl font-bold text-white">
                    {resume.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-300">
                    <Calendar className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span>{formatDate(resume.createdAt)}</span>
                    <span className="text-zinc-600" aria-hidden>
                      ·
                    </span>
                    <span className="text-zinc-400">
                      {formatRelativeTime(resume.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Original File Name */}
              {resume.originalFileName && (
                <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-500">
                    原始文件名：
                  </span>
                  <span className="font-mono">{resume.originalFileName}</span>
                </div>
              )}

              {/* Parsed Content */}
              {hasContent ? (
                <ParsedContentCard
                  content={resume.parsedContent!}
                  onOpenOriginal={handleOpenOriginalFile}
                  resume={resume}
                />
              ) : (
                <EmptyContent />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 px-4">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
                <FileText className="h-8 w-8 text-zinc-400" />
              </div>
              <p className="text-base font-medium text-zinc-700">
                无法加载简历详情
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                请稍后重试或联系管理员
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
