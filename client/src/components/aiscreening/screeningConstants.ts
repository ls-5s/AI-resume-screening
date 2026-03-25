export const SCREENING_STATUS_META = {
  pending: {
    badge: "bg-blue-50 text-blue-500 border border-blue-200",
    dot: "bg-blue-300",
    label: "待筛选",
  },
  passed: {
    badge: "bg-blue-600 text-white border border-blue-600",
    dot: "bg-blue-200",
    label: "已通过",
  },
  rejected: {
    badge: "bg-white text-blue-400 border border-blue-200",
    dot: "bg-blue-200",
    label: "已拒绝",
  },
} as const;
