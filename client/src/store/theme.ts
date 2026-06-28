/**
 * 主题状态管理 (Zustand + persist 中间件)
 *
 * ## 主题切换实现原理
 *
 * 本项目使用 Tailwind CSS 的 "class 策略" 实现明暗主题切换：
 *   1. Tailwind 配置中 `darkMode: "class"`，意味着所有 `dark:` 前缀的样式
 *      只在 `<html>` 标签上有 `class="dark"` 时才生效
 *   2. `applyTheme()` 函数直接操作 `document.documentElement`（即 `<html>`），
 *      移除旧的 light/dark 类名，添加当前主题类名
 *   3. 用户在 ThemeSwitcher 组件中点击切换按钮 → 调用 `setMode()` →
 *      更新 Zustand state + 立即调用 `applyTheme()` 更新 DOM
 *
 * ## 持久化机制
 *
 * 使用 Zustand 的 `persist` 中间件将主题偏好存入 localStorage：
 *   1. `name: "app-theme"` → localStorage key
 *   2. 每次 `setMode()` 调用后自动同步到 localStorage
 *   3. `onRehydrateStorage` → 页面刷新/重新打开时，
 *      从 localStorage 读取上次保存的主题，并调用 `applyTheme()` 恢复
 *   4. 如果没有缓存（首次访问），默认使用 `"light"` 主题
 *
 * ## 数据流示意
 *
 *   ThemeSwitcher 点击
 *       ↓
 *   useThemeStore.setMode("dark")
 *       ↓
 *   set({ mode: "dark" })          ← 更新 Zustand state（触发订阅组件重渲染）
 *   applyTheme("dark")             ← 操作 DOM：<html> 添加 class="dark"
 *       ↓
 *   localStorage.set("app-theme")  ← persist 中间件自动同步
 *       ↓
 *   Tailwind CSS 响应 html.dark    ← 所有 dark:xxx 样式生效
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

// 主题模式：仅支持 light / dark 两种
export type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  // 切换主题并立即应用到 DOM
  setMode: (mode: ThemeMode) => void;
}

/**
 * 将主题应用到 <html> 元素的 class 上
 * Tailwind 的 darkMode: "class" 策略根据 html.dark 类名决定是否启用暗色样式
 */
function applyTheme(mode: ThemeMode) {
  const root = document.documentElement; // <html> 元素
  root.classList.remove("light", "dark");
  root.classList.add(mode);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "light", // 默认亮色主题
      setMode: (mode) => {
        set({ mode });      // 更新 Zustand state → 所有 useThemeStore() 的组件重新渲染
        applyTheme(mode);   // 立即更新 DOM → Tailwind 的 dark: 类开始生效
      },
    }),
    {
      name: "app-theme", // localStorage 中的 key 名
      // 页面加载时，从 localStorage 恢复主题到 DOM
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.mode);
        }
      },
    },
  ),
);
