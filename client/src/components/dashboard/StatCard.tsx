import { TrendingUp, FileText, Clock, CheckCircle, X, Bot } from 'lucide-react';
import type { DashboardStats } from '../../types/dashboard';

// ==================== 颜色映射 ====================
const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'bg-blue-500' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'bg-emerald-500' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'bg-red-500' },
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'bg-violet-500' },
};

const colorClasses: Record<string, string> = Object.fromEntries(
  Object.entries(colorMap).map(([k, v]) => [k, `${v.bg} ${v.icon}`])
);

// ==================== 类型定义 ====================
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'amber' | 'emerald' | 'red' | 'violet';
  trend: string;
  trendUp: boolean;
}

// ==================== 统计卡片配置 ====================
const statCardsConfig = [
  { label: '简历总数', icon: FileText, color: 'blue' as const, field: 'total' as const },
  { label: '待筛选', icon: Clock, color: 'amber' as const, field: 'pending' as const },
  { label: '匹配成功', icon: CheckCircle, color: 'emerald' as const, field: 'passed' as const },
  { label: '已拒绝', icon: X, color: 'red' as const, field: 'rejected' as const },
];

// ==================== 计算趋势数据 ====================
const calculateTrend = (field: 'total' | 'pending' | 'passed' | 'rejected', stats: DashboardStats) => {
  const value = stats[field];
  if (field === 'total') {
    return { value, trend: stats.total > 0 ? '+' + Math.round((stats.todayCount / stats.total) * 100) + '%' : '0%', trendUp: stats.todayCount > 0 };
  }
  return { value, trend: stats.total > 0 ? Math.round((value / stats.total) * 100) + '%' : '0%', trendUp: field === 'passed' };
};

// ==================== 单个统计卡片 ====================
function StatCard({ label, value, icon: Icon, color, trend, trendUp }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${colorClasses[color]} transition-transform group-hover:scale-110 duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
          {trend}
          <TrendingUp className={`w-4 h-4 ${!trendUp && 'rotate-180'}`} />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300 rounded-b-2xl ${colors.border}`}></div>
    </div>
  );
}

// ==================== 欢迎区域 ====================
function WelcomeSection({ todayCount, total, passed }: { todayCount: number; total: number; passed: number }) {
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  return (
    <>
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">欢迎回来！</h1>
        <p className="text-indigo-100">今天有 {todayCount} 份新简历待处理</p>
      </div>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Bot className="w-5 h-5" /></div>
          <div>
            <div className="text-sm font-medium text-gray-900">智能筛选提示</div>
            <div className="text-xs text-gray-500">
              {total > 0 ? <>已通过 AI 筛选 <span className="text-indigo-600 font-semibold">{passRate}%</span> 的简历</> : <>上传简历后即可开始 AI 智能筛选</>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== 统计卡片列表 ====================
export function StatCardList({ stats }: { stats: DashboardStats }) {
  const statCards = statCardsConfig.map((config) => ({ ...config, ...calculateTrend(config.field, stats) }));
  return (
    <>
      <WelcomeSection todayCount={stats.todayCount} total={stats.total} passed={stats.passed} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (<StatCard key={stat.label} {...stat} />))}
      </div>
    </>
  );
}

export default StatCard;
