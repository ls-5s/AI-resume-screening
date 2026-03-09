import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, Users, TrendingUp, ArrowUpRight, Calendar, Bot, X, Mail } from 'lucide-react';
import { getDashboardStats, type Activity } from '../../api/dashboard';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    passed: 0,
    rejected: 0,
    todayCount: 0,
    recentActivities: [] as Activity[]
  });

  // 加载统计数据
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

  useEffect(() => {
    loadStats();
  }, []);

  // 格式化时间显示
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取活动类型显示
  const getActivityInfo = (type: string) => {
    switch (type) {
      case 'upload':
        return { icon: FileText, color: 'blue', action: '上传了新简历' };
      case 'screening':
        return { icon: Bot, color: 'purple', action: 'AI筛选完成' };
      case 'pass':
        return { icon: CheckCircle, color: 'emerald', action: '通过初筛' };
      case 'reject':
        return { icon: X, color: 'red', action: '未通过筛选' };
      case 'interview':
        return { icon: Mail, color: 'violet', action: '收到面试邀请' };
      default:
        return { icon: FileText, color: 'blue', action: '上传了新简历' };
    }
  };

  const statCards = [
    { 
      label: '简历总数', 
      value: stats.total, 
      icon: FileText, 
      color: 'blue',
      trend: stats.total > 0 ? '+' + Math.round((stats.todayCount / stats.total) * 100) + '%' : '0%',
      trendUp: stats.todayCount > 0
    },
    { 
      label: '待筛选', 
      value: stats.pending, 
      icon: Clock, 
      color: 'amber',
      trend: stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) + '%' : '0%',
      trendUp: false
    },
    { 
      label: '匹配成功', 
      value: stats.passed, 
      icon: CheckCircle, 
      color: 'emerald',
      trend: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) + '%' : '0%',
      trendUp: true
    },
    { 
      label: '已拒绝', 
      value: stats.rejected, 
      icon: X, 
      color: 'red',
      trend: stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) + '%' : '0%',
      trendUp: false
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%204V0h-2v4h-4v2h4v4h2V6h4V4h-4z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">欢迎回来！👋</h1>
            <p className="mt-2 text-lg text-white/80">
              今天有 <span className="font-semibold text-white">{stats.todayCount}</span> 份新简历待筛选
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm text-white/80">AI 筛选引擎</div>
              <div className="text-sm font-medium">运行中</div>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, string> = {
            blue: 'bg-blue-50 text-blue-600',
            amber: 'bg-amber-50 text-amber-600',
            emerald: 'bg-emerald-50 text-emerald-600',
            violet: 'bg-violet-50 text-violet-600',
            red: 'bg-red-50 text-red-600',
          };
          const iconBgClass = colorClasses[stat.color];
          
          return (
            <div 
              key={stat.label}
              className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              onClick={() => navigate('/resumes')}
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${iconBgClass} transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {stat.trend}
                  <TrendingUp className={`w-4 h-4 ${!stat.trendUp && 'rotate-180'}`} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300 rounded-b-2xl ${
                stat.color === 'blue' ? 'bg-blue-500' :
                stat.color === 'amber' ? 'bg-amber-500' :
                stat.color === 'emerald' ? 'bg-emerald-500' :
                stat.color === 'red' ? 'bg-red-500' :
                'bg-violet-500'
              }`}></div>
            </div>
          );
        })}
      </div>

      {/* 快捷操作和最近活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快捷操作 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/resumes')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700">上传简历</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700">AI 批量筛选</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </button>
            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700">发送面试邀请</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
            <button 
              onClick={() => navigate('/resumes')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              查看全部 <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-4">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity) => {
                const activityInfo = getActivityInfo(activity.type);
                const Icon = activityInfo.icon;
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/resumes')}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activityInfo.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      activityInfo.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                      activityInfo.color === 'red' ? 'bg-red-100 text-red-600' :
                      activityInfo.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      'bg-violet-100 text-violet-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{activity.resumeName || '未知'}</span>
                        <span className="text-gray-500"> {activityInfo.action}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatTime(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无最近活动</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">智能筛选提示</div>
            <div className="text-xs text-gray-500">
              {stats.total > 0 ? (
                <>已通过 AI 筛选 <span className="text-indigo-600 font-semibold">{Math.round((stats.passed / stats.total) * 100)}%</span> 的简历</>
              ) : (
                <>上传简历后即可开始 AI 智能筛选</>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
