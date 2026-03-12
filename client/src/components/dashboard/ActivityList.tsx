import { FileText, Bot, CheckCircle, X, Mail, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Activity } from "../../types/dashboard";
import { formatRelativeTime } from "../../utils/format";

// ==================== 类型定义 ====================
interface ActivityItemProps {
  activity: Activity;
}

interface ActivityListProps {
  activities: Activity[];
  onViewAll?: () => void;
}

// ==================== 活动配置 ====================
const activityConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  upload: { icon: FileText, color: "blue" },
  screening: { icon: Bot, color: "purple" },
  pass: { icon: CheckCircle, color: "emerald" },
  reject: { icon: X, color: "red" },
  interview: { icon: Mail, color: "violet" },
};

const actionText: Record<string, string> = {
  upload: "上传了新简历",
  screening: "AI筛选完成",
  pass: "通过初筛",
  reject: "未通过筛选",
  interview: "收到面试邀请",
};

const activityColorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  emerald: "bg-emerald-100 text-emerald-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
  violet: "bg-violet-100 text-violet-600",
};

// ==================== 活动列表项组件 ====================
function ActivityItem({ activity }: ActivityItemProps) {
  const navigate = useNavigate();
  const config = activityConfig[activity.type] || activityConfig.upload;
  const Icon = config.icon;
  const action = actionText[activity.type] || "未知操作";

  return (
    <div
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => navigate("/resumes")}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activityColorMap[config.color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="text-sm">
          <span className="font-medium text-gray-900">
            {activity.resumeName || "未知"}
          </span>
          <span className="text-gray-500"> {action}</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <Calendar className="w-3 h-3" />{" "}
          {formatRelativeTime(activity.createdAt)}
        </div>
      </div>
    </div>
  );
}

// 按「简历+类型+时间」去重，避免同一操作被前后端各记一次导致重复展示
function deduplicateActivities(activities: Activity[]): Activity[] {
  const seen = new Set<string>();
  return activities.filter((a) => {
    const key = `${a.resumeId ?? ""}-${a.type}-${a.resumeName ?? ""}-${(a.description ?? "").slice(0, 50)}-${a.createdAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ==================== 活动列表组件 ====================
export function ActivityList({ activities, onViewAll }: ActivityListProps) {
  const displayList = deduplicateActivities(activities);
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            查看全部
          </button>
        )}
      </div>
      <div className="space-y-4">
        {displayList.length > 0 ? (
          displayList.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无最近活动</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityList;
