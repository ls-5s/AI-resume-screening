import { FileText, Clock, CheckCircle, X } from "lucide-react";
import type { DashboardStats } from "../../types/dashboard";

const METRICS = [
  {
    field: "total" as const,
    icon: FileText,
    accent: "text-sky-600",
    iconBg: "bg-sky-500/12",
    desc: "全部简历",
    bar: "border-t-sky-500/90",
    hoverRing: "hover:ring-sky-500/15",
  },
  {
    field: "pending" as const,
    icon: Clock,
    accent: "text-amber-600",
    iconBg: "bg-amber-500/12",
    desc: "等待处理",
    bar: "border-t-amber-500/90",
    hoverRing: "hover:ring-amber-500/15",
  },
  {
    field: "passed" as const,
    icon: CheckCircle,
    accent: "text-emerald-600",
    iconBg: "bg-emerald-500/12",
    desc: "通过筛选",
    bar: "border-t-emerald-500/90",
    hoverRing: "hover:ring-emerald-500/15",
  },
  {
    field: "rejected" as const,
    icon: X,
    accent: "text-red-600",
    iconBg: "bg-red-500/12",
    desc: "不符合条件",
    bar: "border-t-red-500/85",
    hoverRing: "hover:ring-red-500/15",
  },
];

export function StatCardList({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {METRICS.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.field}
            className={`
              group relative flex flex-col rounded-2xl border border-zinc-200/80 bg-white
              px-5 py-5 shadow-[0_1px_3px_-1px_rgba(15,23,42,0.08),0_4px_16px_-4px_rgba(15,23,42,0.06)]
              ring-1 ring-zinc-950/[0.03] transition-all duration-300 ease-out
              hover:-translate-y-0.5 hover:border-zinc-200 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)]
              hover:ring-2 sm:px-6 sm:py-6
              ${m.bar} border-t-[3px] ${m.hoverRing}
            `}
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                {m.desc}
              </span>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${m.iconBg} ${m.accent} transition-transform duration-300 group-hover:scale-105`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
            </div>
            <p className="text-3xl font-semibold tabular-nums tracking-tight text-zinc-900 lg:text-[2rem]">
              {stats[m.field].toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default StatCardList;
