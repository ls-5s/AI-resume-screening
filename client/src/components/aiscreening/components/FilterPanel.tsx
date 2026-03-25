import React from "react";
import { Search, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FilterStatus = "all" | "passed" | "failed" | "pending";
export type SortKey = "score" | "name" | "date";

interface FilterPanelProps {
  search: string;
  onSearchChange: (v: string) => void;
  status: FilterStatus;
  onStatusChange: (v: FilterStatus) => void;
  sortKey: SortKey;
  onSortChange: (v: SortKey) => void;
  resultCount: number;
}

const STATUS_TABS: { label: string; value: FilterStatus; dot: string }[] = [
  { label: "全部", value: "all", dot: "bg-slate-400" },
  { label: "通过", value: "passed", dot: "bg-emerald-500" },
  { label: "淘汰", value: "failed", dot: "bg-rose-500" },
  { label: "待评估", value: "pending", dot: "bg-amber-400" },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "评分排序", value: "score" },
  { label: "姓名排序", value: "name" },
  { label: "时间排序", value: "date" },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortKey,
  onSortChange,
  resultCount,
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-sm px-4 py-3 mb-4 flex flex-col md:flex-row md:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索候选人姓名、岗位…"
          className="pl-9 h-9 text-sm bg-slate-50 border-slate-200 focus:border-indigo-400 focus:ring-indigo-100 rounded-lg"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
        {STATUS_TABS.map(({ label, value, dot }) => (
          <button
            key={value}
            onClick={() => onStatusChange(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
              status === value
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Sort + Count */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <SlidersHorizontal className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <select
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            className="pl-8 pr-7 h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 appearance-none focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            {SORT_OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">
          共 <span className="font-semibold text-slate-600">{resultCount}</span> 人
        </span>
      </div>
    </div>
  );
};
