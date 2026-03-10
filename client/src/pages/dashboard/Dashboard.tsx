import { useState, useEffect } from 'react';
import { getDashboardStats } from '../../api/dashboard';
import type { DashboardStats } from '../../types/dashboard';
import { StatCardList, ActivityList, QuickActions } from '../../components/dashboard';
import { toast } from 'sonner';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    passed: 0,
    rejected: 0,
    todayCount: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('加载统计数据失败:', error);
        toast.error('加载统计数据失败');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatCardList stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions />
        <ActivityList 
          activities={stats.recentActivities} 
          onViewAll={() => window.location.href = '/resumes'} 
        />
      </div>
    </div>
  );
}
