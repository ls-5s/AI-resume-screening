import {
  Loader2,
  FileText,
  Eye,
  Mail,
  Phone,
  Calendar,
  HardDrive,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../Drawer";
import type { Resume } from "../../types/resume";
import { formatFileSize, formatDate, formatRelativeTime } from "../../utils/format";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ============================================================================
// Types & Constants
// ============================================================================

type StatusType = "pending" | "passed" | "rejected";

interface StatusConfig {
  label: string;
  icon: typeof Clock;
  gradient: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  pending: {
    label: "待筛选",
    icon: Clock,
    gradient: "from-amber-500 via-orange-500 to-amber-600",
    textColor: "text-amber-500",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
  },
  passed: {
    label: "已通过",
    icon: CheckCircle2,
    gradient: "from-emerald-500 via-teal-500 to-emerald-600",
    textColor: "text-emerald-500",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
  },
  rejected: {
    label: "已拒绝",
    icon: XCircle,
    gradient: "from-rose-500 via-pink-500 to-rose-600",
    textColor: "text-rose-500",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-700",
    badgeBorder: "border-rose-200",
  },
};

interface ResumeDetailDrawerProps {
  resume: Resume | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================================
// Avatar Component
// ============================================================================

const ProfileAvatar = ({ name }: { name: string }) => {
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-500/30">
        <span className="text-2xl font-bold text-white">{initials || "R"}</span>
      </div>
      <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-xl bg-white shadow-lg">
        <User className="h-3.5 w-3.5 text-violet-600" />
      </div>
    </div>
  );
};

// ============================================================================
// Status Badge Component
// ============================================================================

const StatusBadge = ({ status }: { status: StatusType }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold
        ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}
      `}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  );
};

// ============================================================================
// Meta Tag Component
// ============================================================================

const MetaTag = ({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HardDrive;
  label: string;
  value: string;
}) => (
  <div className="inline-flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-sm">
    <Icon className="h-4 w-4 text-zinc-400" />
    <span className="font-medium text-zinc-600">{label}:</span>
    <span className="text-zinc-900">{value}</span>
  </div>
);

// ============================================================================
// AI Summary Card Component
// ============================================================================

const AISummaryCard = ({ summary }: { summary: string }) => (
  <div className="relative overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6">
    {/* Background decoration */}
    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-200/30" />
    <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-purple-200/20" />

    <div className="relative">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-900">AI 智能解析</h3>
          <p className="text-xs text-zinc-500">自动提取简历关键信息</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
        {summary}
      </p>
    </div>
  </div>
);

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
    <h4 className="mb-2 text-base font-medium text-zinc-700">暂无简历解析内容</h4>
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

  const hasSummary = !!resume?.summary;
  const hasContent = !!resume?.parsedContent;
  const statusConfig = resume ? (STATUS_CONFIG[resume.status as StatusType] || STATUS_CONFIG.pending) : null;

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
              {/* Profile Header */}
              <div
                className={`
                  relative overflow-hidden rounded-2xl border border-transparent
                  bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6
                `}
              >
                {/* Background decoration */}
                <div
                  className={`
                    absolute -right-12 -top-12 h-40 w-40 rounded-full
                    bg-gradient-to-br ${statusConfig?.gradient || "from-violet-500 to-purple-600"}
                    opacity-20 blur-3xl
                  `}
                />
                <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-violet-500/10" />

                <div className="relative flex items-start gap-5">
                  <ProfileAvatar name={resume.name} />

                  <div className="flex-1 min-w-0 pt-2">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-2xl font-bold text-white">
                        {resume.name}
                      </h2>
                      <StatusBadge status={resume.status as StatusType} />
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4">
                      {resume.email && (
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Mail className="h-4 w-4 text-zinc-500" />
                          <span>{resume.email}</span>
                        </div>
                      )}
                      {resume.phone && (
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Phone className="h-4 w-4 text-zinc-500" />
                          <span>{resume.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta Info Bar */}
                <div className="relative mt-6 flex flex-wrap gap-3 pt-5 border-t border-white/10">
                  <MetaTag
                    icon={HardDrive}
                    label="文件类型"
                    value={resume.fileType?.toUpperCase() || "-"}
                  />
                  <MetaTag
                    icon={FileText}
                    label="文件大小"
                    value={formatFileSize(resume.fileSize || 0)}
                  />
                  <MetaTag
                    icon={Calendar}
                    label="上传时间"
                    value={formatDate(resume.createdAt)}
                  />
                  <MetaTag
                    icon={Clock}
                    label="上传于"
                    value={formatRelativeTime(resume.createdAt)}
                  />
                </div>
              </div>

              {/* Original File Name */}
              {resume.originalFileName && (
                <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-500">原始文件名：</span>
                  <span className="font-mono">{resume.originalFileName}</span>
                </div>
              )}

              {/* AI Summary */}
              {hasSummary && <AISummaryCard summary={resume.summary!} />}

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
