import instance from "../utils/http";
import type { Activity, DashboardStats, LogActivityParams } from "../types/dashboard";

/**
 * 获取 Dashboard 统计数据
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return instance.get('/v1/dashboard/stats');
};

/**
 * 记录活动
 */
export const logActivity = async (params: LogActivityParams): Promise<void> => {
  return instance.post('/v1/activity', params);
};
