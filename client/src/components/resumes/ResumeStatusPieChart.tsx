import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface ResumeStatusPieChartProps {
  total: number;
  pending: number;
  passed: number;
  rejected: number;
}

const STATUS_COLORS = {
  pending: "#f59e0b", // amber-500
  passed: "#10b981",  // emerald-500
  rejected: "#ef4444", // red-500
};

export function ResumeStatusPieChart({
  total,
  pending,
  passed,
  rejected,
}: ResumeStatusPieChartProps) {
  const data: StatusData[] = [
    { name: "等待处理", value: pending, color: STATUS_COLORS.pending },
    { name: "通过筛选", value: passed, color: STATUS_COLORS.passed },
    { name: "不符合条件", value: rejected, color: STATUS_COLORS.rejected },
  ].filter((d) => d.value > 0);

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: StatusData }[];
  }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
    return (
      <div className="rounded-xl border border-zinc-200/90 bg-white/95 px-3.5 py-2.5 text-sm shadow-lg shadow-zinc-900/10 backdrop-blur-sm">
        <p className="text-xs font-medium text-zinc-500">{item.name}</p>
        <p className="text-base font-semibold tabular-nums text-zinc-900">
          {item.value} 份
          <span className="ml-1.5 text-xs font-normal text-zinc-400">
            ({pct}%)
          </span>
        </p>
      </div>
    );
  };

  if (total === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)]">
        <p className="text-sm text-zinc-400">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[240px] flex-col overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100/80 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-900">
            简历状态分布
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            共 {total.toLocaleString()} 份 · 按状态统计
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            待筛选 {pending}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            已通过 {passed}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            已拒绝 {rejected}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-4 pt-2 sm:px-5">
        <div className="relative flex h-[200px] w-full sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    strokeWidth={0}
                    style={{ outline: "none" }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                offset={70}
                wrapperStyle={{ outline: "none" }}
              />
            </PieChart>
          </ResponsiveContainer>
          {total > 0 && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <span className="text-2xl font-bold tabular-nums text-zinc-900">
                {total}
              </span>
              <span className="text-xs text-zinc-500">全部</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
