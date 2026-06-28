/**
 * 筛选模板类型定义
 * 模板数据结构、筛选条件配置接口
 */

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

/** 后端返回的原始模板行（config 可能为 JSON 字符串） */
export type RawTemplateRow = {
  id: number;
  userId: number;
  name: string;
  config?: unknown;
  isDefault?: unknown;
  createdAt: string;
  updatedAt: string;
};

/** 创建 / 更新模板时的请求体 */
export type ScreeningTemplatePatch = {
  name: string;
  config: PreFilterConfig;
};
