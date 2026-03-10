import { FileText, Bot, Users, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: FileText,
      label: '上传简历',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      path: '/resumes',
    },
    {
      icon: Bot,
      label: 'AI 批量筛选',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      path: '/resumes',
    },
    {
      icon: Users,
      label: '发送面试邀请',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      path: '/candidates',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button 
              key={action.label}
              onClick={() => navigate(action.path)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 ${action.bgColor} ${action.textColor} rounded-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700">{action.label}</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default QuickActions;
