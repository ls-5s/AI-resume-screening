import instance from "../utils/http";

export interface Activity {
  id: number;
  userId: number;
  type: 'upload' | 'screening' | 'pass' | 'reject' | 'interview';
  resumeId: number | null;
  resumeName: string | null;
  description: string | null;
  createdAt: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  passed: number;
  rejected: number;
  todayCount: number;
  recentActivities: Activity[];
}

/**
 * 获取 Dashboard 统计数据
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return instance.get('/v1/dashboard/stats');
};

/**
 * 记录活动
 */
export const logActivity = async (params: {
  type: Activity['type'];
  resumeId?: number;
  resumeName?: string;
  description?: string;
}): Promise<void> => {
  return instance.post('/v1/activity', params);
};
