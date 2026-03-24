import {
  Loader2,
  FileText,
  Eye,
  Trash2,
  Mail,
  Phone,
  Calendar,
  HardDrive,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import type { Resume } from "../../types/resume";
import { formatFileSize, formatDate, formatRelativeTime } from "../../utils/format";

// ============================================================================
// Types & Constants
// ============================================================================

type StatusType = "pending" | "passed" | "rejected";

interface StatusConfig {
  label: string;
  icon: typeof Clock;
  color: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  gradient: string;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  pending: {
    label: "待筛选",
    icon: Clock,
    color: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    },
    gradient: "from-amber-50 to-orange-50",
  },
  passed: {
    label: "已通过",
    icon: CheckCircle2,
    color: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    gradient: "from-emerald-50 to-teal-50",
  },
  rejected: {
    label: "已拒绝",
    icon: XCircle,
    color: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
      dot: "bg-rose-500",
    },
    gradient: "from-rose-50 to-pink-50",
  },
};

interface ResumeListProps {
  resumes: Resume[];
  loading: boolean;
  onView: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}

// ============================================================================
// Avatar Component
// ============================================================================

const ResumeAvatar = ({
  name,
  hasSummary,
}: {
  name: string;
  hasSummary: boolean;
}) => {
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const colors = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-rose-500 to-pink-600",
  ];

  const colorIndex = name.length % colors.length;
  const gradient = colors[colorIndex];

  return (
    <div
      className={`relative h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}
    >
      <span className="text-sm font-bold text-white">{initials || "R"}</span>
      {hasSummary && (
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 shadow-sm">
          <Sparkles className="h-2.5 w-2.5 text-white" />
        </div>
      )}
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
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium
        ${config.color.bg} ${config.color.text} ${config.color.border}
      `}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.color.dot} animate-pulse`}
      />
      <Icon className="h-3 w-3" />
      {config.label}
    </div>
  );
};

// ============================================================================
// Empty State Component
// ============================================================================

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <div className="relative mb-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-zinc-100 to-zinc-200">
        <FileText className="h-10 w-10 text-zinc-400" />
      </div>
      <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
    </div>
    <h3 className="mb-2 text-lg font-semibold text-zinc-900">
      暂无简历数据
    </h3>
    <p className="text-sm text-zinc-500 text-center max-w-sm">
      上传简历或从邮箱导入，开始智能筛选候选人
    </p>
  </div>
);

// ============================================================================
// Loading State Component
// ============================================================================

const LoadingState = () => (
  <div className="flex items-center justify-center py-20">
    <div className="relative">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    </div>
  </div>
);

// ============================================================================
// Resume Item Component
// ============================================================================

const ResumeItem = ({
  resume,
  onView,
  onDelete,
}: {
  resume: Resume;
  onView: () => void;
  onDelete: () => void;
}) => {
  const statusConfig = STATUS_CONFIG[resume.status as StatusType] || STATUS_CONFIG.pending;
  const hasSummary = !!resume.summary;
  const relativeTime = formatRelativeTime(resume.createdAt);

  return (
    <div className="group relative">
      {/* Hover accent line */}
      <div
        className={`
          absolute left-0 top-0 h-full w-1 rounded-l-2xl
          bg-gradient-to-b ${statusConfig.gradient.replace("50", "500")}
          opacity-0 transition-opacity duration-300 group-hover:opacity-100
        `}
      />

      <div
        className={`
          flex items-start gap-4 p-5 transition-all duration-200
          hover:bg-zinc-50/80 cursor-pointer rounded-2xl
          border border-transparent hover:border-zinc-100
        `}
        onClick={onView}
      >
        {/* Avatar */}
        <ResumeAvatar name={resume.name} hasSummary={hasSummary} />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="truncate text-base font-semibold text-zinc-900">
                  {resume.name}
                </h3>
                <StatusBadge status={resume.status as StatusType} />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-zinc-500 mb-3">
            {resume.email && (
              <div className="flex items-center gap-1.5">
                <Mail size={14} className="text-zinc-400" />
                <span className="truncate max-w-[200px]">{resume.email}</span>
              </div>
            )}
            {resume.phone && (
              <div className="flex items-center gap-1.5">
                <Phone size={14} className="text-zinc-400" />
                <span>{resume.phone}</span>
              </div>
            )}
          </div>

          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <HardDrive size={12} />
              <span className="font-medium">
                {resume.fileType?.toUpperCase()}
              </span>
              <span>·</span>
              <span>{formatFileSize(resume.fileSize || 0)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>{formatDate(resume.createdAt)}</span>
              <span className="text-zinc-300">·</span>
              <span>{relativeTime}</span>
            </div>
          </div>

          {/* Summary Preview */}
          {hasSummary && (
            <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-violet-50/50 to-purple-50/50 border border-violet-100/50">
              <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed">
                {resume.summary}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="flex items-center justify-center h-9 w-9 rounded-xl text-zinc-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
            title="查看详情"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex items-center justify-center h-9 w-9 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
            title="删除"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export function ResumeList({
  resumes,
  loading,
  onView,
  onDelete,
}: ResumeListProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (resumes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="divide-y divide-zinc-100/80">
      {resumes.map((resume) => (
        <div key={resume.id}>
          <ResumeItem
            resume={resume}
            onView={() => onView(resume.id)}
            onDelete={() => onDelete(resume.id, resume.name)}
          />
        </div>
      ))}
    </div>
  );
}
