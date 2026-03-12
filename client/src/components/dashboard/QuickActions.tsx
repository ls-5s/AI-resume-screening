import { FileText, Bot, Users, ArrowUpRight } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      icon: FileText,
      label: '上传简历',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
    },
    {
      icon: Bot,
      label: 'AI 批量筛选',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
    },
    {
      icon: Users,
      label: '发送面试邀请',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <div 
              key={action.label}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 ${action.bgColor} ${action.textColor} rounded-lg`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-700">{action.label}</span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuickActions;
