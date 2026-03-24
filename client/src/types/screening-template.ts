import type { PreFilterConfig } from "../components/aiscreening/preFilterUtils";

/** 筛选模板（与后端 screening_templates 对齐） */
export type ScreeningTemplate = {
  id: number;
  userId: number;
  name: string;
  config: PreFilterConfig;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};
