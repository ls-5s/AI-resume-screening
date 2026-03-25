import React from "react";
import { Users, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

interface StatsBarProps {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  passRate: number;
}

const statConfig = [
  {
    key: "total" as const,
    label: "总候选人",
    icon: Users,
    colorClass: "text-slate-600",
    bgClass: "bg-slate-100",
  },
  {
    key: "passed" as const,
    label: "通过",
    icon: CheckCircle,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
  },
  {
    key: "failed" as const,
    label: "淘汰",
    icon: XCircle,
    colorClass: "text-rose-500",
    bgClass: "bg-rose-50",
  },
  {
    key: "pending" as const,
    label: "待评估",
    icon: Clock,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-50",
  },
];

export const StatsBar: React.FC<StatsBarProps> = ({
  total,
  passed,
  failed,
  pending,
  passRate,
}) => {
  const values = { total, passed, failed, pending };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {statConfig.map(({ key, label, icon: Icon, colorClass, bgClass }) => (
        <div
          key={key}
          className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <div className={`p-2 rounded-lg ${bgClass}`}>
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
          <div>
            <p className="text-xs text-slate-400 leading-none mb-1">{label}</p>
            <p className={`text-xl font-bold ${colorClass} leading-none`}>
              {values[key]}
            </p>
          </div>
        </div>
      ))}

      {/* Pass Rate */}
      <div className="bg-indigo-600 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="p-2 rounded-lg bg-indigo-500">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-xs text-indigo-200 leading-none mb-1">通过率</p>
          <p className="text-xl font-bold text-white leading-none">
            {passRate.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
};
