/**
 * ActivityList — 最近动态组件
 * 用于仪表盘首页的右侧"最近动态"卡片，展示最近 8 条去重活动
 *
 * ## 去重策略
 *
 * 后端返回的活动可能来自同一份简历在短时间内产生的多次操作
 * （例如：上传简历会同时产生 upload + screening 两条记录），
 * 如果完全不去重，仪表盘会显得重复。
 *
 * `deduplicate()` 的去重 key 由以下组成：
 *   - resumeId：同一份简历
 *   - type：同一操作类型
 *   - resumeName：同一个人名
 *   - minute：同一分钟内的操作归为一组
 *
 * 这样同一分钟内的同类型操作只显示一次，避免视觉噪音。
 */

import { FileText } from "lucide-react";
import { Link } from "react-router-dom";
import type { Activity } from "../../types/dashboard";
import { parseServerDate } from "../../utils/format";
import { ActivityTimelineRow } from "./activity-timeline";

interface ActivityListProps {
  activities: Activity[];
}

/**
 * 活动去重：同简历 + 同类型 + 同人名 + 同一分钟内只保留第一条
 * @returns 去重后的活动数组
 */
function deduplicate(activities: Activity[]): Activity[] {
  const seen = new Set<string>();
  return activities.filter((a) => {
    // 解析时间戳，取分钟粒度（除以 60000）
    const t = parseServerDate(a.createdAt)?.getTime() ?? 0;
    const minute = t > 0 ? Math.floor(t / 60_000) : 0;
    // 组合去重 key：简历ID-操作类型-候选人名-分钟
    const key = `${a.resumeId ?? ""}-${a.type}-${a.resumeName ?? ""}-${minute}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function ActivityList({ activities }: ActivityListProps) {
  // 去重后取前 8 条
  const list = deduplicate(activities).slice(0, 8);

  return (
    <div className="flex h-full min-h-[300px] flex-col overflow-hidden rounded-3xl border border-(--app-border) bg-(--app-surface) shadow-(--app-shadow-sm) ring-1 ring-(--app-border-subtle)">
      {/* 卡片头部：标题 + 副标题 + "查看全部"链接 */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-(--app-border)/80 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-(--app-text-primary)">
            最近动态
          </h2>
          <p className="mt-0.5 text-xs text-(--app-text-secondary)">
            投递候选人相关动态（姓名指候选人，非操作人）
          </p>
        </div>
        {/* 跳转到完整活动日志页 */}
        <Link
          to="/app/activities"
          className="text-xs font-semibold text-(--app-primary) no-underline transition-colors hover:text-(--app-primary-hover)"
        >
          查看全部
        </Link>
      </div>

      {/* 卡片内容：有数据 → 时间线列表 / 空 → 引导去简历库 */}
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-5">
        {list.length > 0 ? (
          <div className="flex flex-col">
            {list.map((activity, i) => (
              <ActivityTimelineRow
                key={activity.id}
                activity={activity}
                isLast={i === list.length - 1}  // 最后一行不画竖线连接
              />
            ))}
          </div>
        ) : (
          // 空状态：图标 + 说明文字 + 引导按钮
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-(--app-surface-raised) px-6 py-10 text-center ring-1 ring-inset ring-(--app-border-subtle)">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--app-surface) shadow-sm ring-1 ring-(--app-border)">
              <FileText className="h-7 w-7 text-(--app-text-muted)" strokeWidth={1.25} />
            </div>
            <p className="text-sm font-medium text-(--app-text-secondary)">暂无动态</p>
            <p className="mt-1 max-w-[240px] text-xs text-(--app-text-muted)">
              上传或筛选简历后，这里会展示时间线
            </p>
            {/* 引导用户前往简历库上传/处理简历 */}
            <Link
              to="/app/resumes"
              className="mt-5 rounded-full bg-(--app-primary) px-4 py-2 text-xs font-semibold text-white no-underline shadow-sm transition-colors hover:bg-(--app-primary-hover)"
            >
              前往简历库
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityList;
