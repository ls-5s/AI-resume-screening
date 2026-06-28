/**
 * AI 智能筛选页 (路由: /app/aiscreening)
 * AI 驱动的简历筛选：上传岗位要求、AI 评分、结果排序
 */

import { AiScreening } from "../../components/aiscreening/AiScreening";

/**
 * AI 智能筛选路由页：视觉与交互由 AiScreening 工作台组件统一实现（12 栅格 4+8、模态配置、列表/详情双栏）。
 */
export default function AiScreeningPage() {
  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col bg-(--app-bg)/50">
      <AiScreening />
    </div>
  );
}
