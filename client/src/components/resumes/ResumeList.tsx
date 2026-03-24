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
} from "lucide-react";
import type { Resume } from "../../types/resume";
import {
  formatFileSize,
  formatDate,
  formatRelativeTime,
} from "../../utils/format";

// ============================================================================
// Types & Constants
// ============================================================================

type StatusType = "pending" | "passed" | "rejected";

interface StatusConfig {
  label: string;
  icon: typeof Clock;
  pill: string;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  pending: {
    label: "待筛选",
    icon: Clock,
    pill: "bg-amber-50 text-amber-800 border-amber-200/80",
  },
  passed: {
    label: "已通过",
    icon: CheckCircle2,
    pill: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  },
  rejected: {
    label: "已拒绝",
    icon: XCircle,
    pill: "bg-rose-50 text-rose-800 border-rose-200/80",
  },
};

interface ResumeListProps {
  resumes: Resume[];
  loading: boolean;
  onView: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

// ============================================================================
// Avatar
// ============================================================================

const ResumeAvatar = ({ name }: { name: string }) => {
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200/60">
      {initials || "—"}
    </div>
  );
};

// ============================================================================
// Status badge
// ============================================================================

const StatusBadge = ({ status }: { status: StatusType }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${config.pill}`}
    >
      <Icon className="h-3 w-3 shrink-0 opacity-80" />
      {config.label}
    </span>
  );
};

// ============================================================================
// Empty / Loading
// ============================================================================

const EmptyState = ({
  title = "暂无简历数据",
  description = "上传简历或从邮箱导入，开始智能筛选候选人",
}: {
  title?: string;
  description?: string;
}) => (
  <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-zinc-50/60 px-6 py-14 text-center ring-1 ring-inset ring-zinc-950/4">
    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/80">
      <FileText className="h-7 w-7 text-zinc-300" strokeWidth={1.25} />
    </div>
    <p className="text-sm font-medium text-zinc-600">{title}</p>
    <p className="mt-1 max-w-[240px] text-xs text-zinc-400">{description}</p>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-1 items-center justify-center py-14">
    <Loader2
      className="h-8 w-8 animate-spin text-zinc-400"
      strokeWidth={1.75}
    />
  </div>
);

// ============================================================================
// Desktop table：与 ActivityList panel 内容区对齐
// ============================================================================

function ResumeTable({
  resumes,
  onView,
  onDelete,
}: {
  resumes: Resume[];
  onView: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}) {
  return (
    <div className="hidden md:block">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <th className="px-6 py-3 font-medium">候选人</th>
            <th className="px-4 py-3 font-medium">状态</th>
            <th className="px-4 py-3 font-medium">联系方式</th>
            <th className="px-4 py-3 font-medium">文件</th>
            <th className="px-4 py-3 font-medium">导入时间</th>
            <th className="px-6 py-3 pr-6 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {resumes.map((resume) => (
            <tr
              key={resume.id}
              className="bg-white transition-colors hover:bg-zinc-50/80"
            >
              <td className="px-6 py-3.5 align-middle">
                <button
                  type="button"
                  onClick={() => onView(resume.id)}
                  className="flex max-w-[200px] items-center gap-3 text-left"
                >
                  <ResumeAvatar name={resume.name} />
                  <span className="truncate font-medium text-zinc-900">
                    {resume.name}
                  </span>
                </button>
              </td>
              <td className="px-4 py-3.5 align-middle">
                <StatusBadge status={resume.status as StatusType} />
              </td>
              <td className="px-4 py-3.5 align-middle">
                <div className="flex max-w-[220px] flex-col gap-0.5 text-zinc-600">
                  {resume.email ? (
                    <span className="flex items-center gap-1.5 truncate text-xs">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      {resume.email}
                    </span>
                  ) : null}
                  {resume.phone ? (
                    <span className="flex items-center gap-1.5 text-xs tabular-nums">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      {resume.phone}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">—</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3.5 align-middle text-xs text-zinc-600">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="font-medium">
                    {resume.fileType?.toUpperCase() ?? "—"}
                  </span>
                  <span className="text-zinc-300">·</span>
                  <span>{formatFileSize(resume.fileSize || 0)}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 align-middle text-xs text-zinc-600">
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 tabular-nums">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                    {formatDate(resume.createdAt)}
                  </span>
                  <span className="pl-5 text-zinc-400">
                    {formatRelativeTime(resume.createdAt)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-3.5 pr-6 align-middle text-right">
                <div className="inline-flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onView(resume.id)}
                    className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    title="查看详情"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(resume.id, resume.name)}
                    className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Mobile compact cards
// ============================================================================

function ResumeMobileCard({
  resume,
  onView,
  onDelete,
}: {
  resume: Resume;
  onView: () => void;
  onDelete: () => void;
}) {
  const hasSummary = !!resume.summary;

  return (
    <div className="border-b border-zinc-100 px-4 py-3 last:border-b-0 md:hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onView}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView();
          }
        }}
        className="cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
      >
        <div className="flex gap-3">
          <ResumeAvatar name={resume.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-zinc-900">
                {resume.name}
              </h3>
              <StatusBadge status={resume.status as StatusType} />
            </div>
            <div className="mt-1.5 space-y-0.5 text-xs text-zinc-500">
              {resume.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 shrink-0 text-zinc-400" />
                  {resume.email}
                </div>
              )}
              {resume.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0 text-zinc-400" />
                  {resume.phone}
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-400">
              <span>
                {resume.fileType?.toUpperCase()} ·{" "}
                {formatFileSize(resume.fileSize || 0)}
              </span>
              <span>{formatRelativeTime(resume.createdAt)}</span>
            </div>
            {hasSummary && (
              <p className="mt-2 line-clamp-2 border-l-2 border-zinc-200 pl-2 text-xs leading-relaxed text-zinc-600">
                {resume.summary}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-1 border-t border-zinc-50 pt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
        >
          查看
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
        >
          删除
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main
// ============================================================================

export function ResumeList({
  resumes,
  loading,
  onView,
  onDelete,
  emptyTitle,
  emptyDescription,
}: ResumeListProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (resumes.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <ResumeTable resumes={resumes} onView={onView} onDelete={onDelete} />
      <div className="md:hidden divide-y divide-zinc-100">
        {resumes.map((resume) => (
          <ResumeMobileCard
            key={resume.id}
            resume={resume}
            onView={() => onView(resume.id)}
            onDelete={() => onDelete(resume.id, resume.name)}
          />
        ))}
      </div>
    </>
  );
}
