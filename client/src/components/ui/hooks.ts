/**
 * UI 自定义 Hooks
 * 通用的 UI 状态管理 hooks（如 useToggle、useDebounce）
 */

import { useMemo, useCallback } from "react";

/**
 * 检测表单是否有未保存的更改
 */
export function useFormDirty<T extends Record<string, unknown>>(formData: T, originalData: T): boolean {
  return useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);
}

/**
 * 通用表单字段更新函数
 */
export function useFormUpdate<T extends Record<string, unknown>>(
  setFormData: React.Dispatch<React.SetStateAction<T>>
) {
  return useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, [setFormData]);
}
