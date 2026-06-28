/**
 * 样式类名合并工具
 * 合并多个 CSS 类名，过滤假值，解决 Tailwind 类名冲突
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
