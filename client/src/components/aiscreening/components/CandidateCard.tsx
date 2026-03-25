import React from "react";
import { ChevronRight, Star } from "lucide-react";

export interface CandidateInfo {
  id: number;
  name: string;
  phone?: string | null;
  score?: number | null;
  status: "pending" | "passed" | "rejected";
}

interface CandidateCardProps {
  candidate: CandidateInfo;
  isSelected: boolean;
  screeningResultScore?: number | null;
  onClick: () => void;
}

const STATUS_CONFIG = {
  passed: {
    label: "已通过",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "已拒绝",
    className: "bg-rose-50 text-rose-600 border-rose-200",
    dot: "bg-rose-500",
  },
  pending: {
    label: "待筛选",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-emerald-50 border-emerald-100";
  if (score >= 60) return "bg-amber-50 border-amber-100";
  return "bg-rose-50 border-rose-100";
};

function getInitials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  return t.slice(0, 1).toUpperCase();
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  isSelected,
  screeningResultScore,
  onClick,
}) => {
  const statusConf = STATUS_CONFIG[candidate.status];
  const scoreVal = candidate.score ?? screeningResultScore ?? null;

  return (
    <li
      role="option"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-1 ${
        isSelected
          ? "border-sky-200 bg-sky-50/60 shadow-sm ring-1 ring-sky-100"
          : "border-transparent bg-white/50 hover:border-zinc-200 hover:bg-white"
      }`}
    >
      {/* Selected bar */}
      {isSelected && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-sky-500" />
      )}

      {/* Avatar */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors ${
          isSelected
            ? "bg-sky-600 text-white"
            : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
        }`}
        aria-hidden
      >
        {getInitials(candidate.name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-900">
          {candidate.name}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${
              statusConf.className
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} />
            {statusConf.label}
          </span>
          {candidate.phone && (
            <span className="truncate text-[11px] text-zinc-400">
              {candidate.phone.slice(0, 3)}···
            </span>
          )}
        </div>
      </div>

      {/* Score + arrow */}
      <div className="flex shrink-0 items-center gap-1">
        {scoreVal != null && (
          <span
            className={`flex items-center gap-0.5 rounded-lg border px-1.5 py-0.5 text-xs font-bold tabular-nums ${
              getScoreBg(scoreVal)
            } ${getScoreColor(scoreVal)}`}
          >
            <Star className="h-2.5 w-2.5" />
            {scoreVal}
          </span>
        )}
        <ChevronRight
          className={`h-3.5 w-3.5 transition-colors ${
            isSelected
              ? "text-sky-400"
              : "text-zinc-200 group-hover:text-zinc-400"
          }`}
        />
      </div>
    </li>
  );
};
