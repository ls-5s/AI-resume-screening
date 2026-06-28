/**
 * GitHub OAuth 回调页 (路由: /auth/github/callback)
 * 处理 GitHub 授权回调，获取 code 换取 Token 并登录
 *
 * ## OAuth 流程
 *   1. 用户在登录页点击 "GitHub 登录" → 跳转到 GitHub 授权页
 *   2. 用户在 GitHub 上点击 "Authorize" → GitHub 重定向到本页，URL 带 ?code=xxx
 *   3. 本页从 URL 提取 code → 调 githubRegister(code) → 后端用 code 换 GitHub access_token
 *      → 后端创建/查找用户 → 返回 JWT token + 用户信息
 *   4. 前端收到 token → 写入 Zustand store（login()）→ 跳转 /app
 *
 * ## 过期重试机制
 *   GitHub 授权码 code 有效期极短（约 10 分钟），如果用户在授权页停留过久，
 *   code 可能过期。此时后端返回 "incorrect or expired" 错误：
 *     1. 前端检测到过期错误 → retryCountRef < MAX_RETRY_COUNT（2 次）
 *     2. 调 getGithubAuthUrl() 重新获取 GitHub 授权 URL
 *     3. 1 秒后跳转到新授权 URL（给 toast 提示留出显示时间）
 *     4. 重试次数耗尽 → 回退到 /auth/login
 *
 * ## 页面渲染
 *   本页无实际 UI 交互，只显示全屏居中 loading 转圈 + "正在处理 GitHub 登录..."
 *   所有逻辑在 useEffect 中自动执行，用户无需手动操作
 */

import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useLoginStore } from "../../store/Login";
import toast from "../../utils/toast";
import { githubRegister, getGithubAuthUrl } from "../../api/auth";

// GitHub 授权码过期时最大重试次数（避免无限循环重试）
const MAX_RETRY_COUNT = 2;

export default function GithubCallback() {
  // 从 URL 查询参数中读取 GitHub 回调携带的 ?code=xxx 和 ?state=xxx
  const [searchParams] = useSearchParams();
  // 从 Zustand store 获取 login action，用于将 JWT token 和用户信息写入全局状态
  const { login } = useLoginStore();
  // 过期重试计数器（用 useRef 而非 useState，因为值变化不需要触发重渲染）
  const retryCountRef = useRef(0);

  // 页面加载时立即从 URL 提取 code 并发起登录请求
  useEffect(() => {
    const code = searchParams.get("code");

    // GitHub 拒绝授权或回调异常 → code 为 null → 提示并跳回首页
    if (!code) {
      toast.error("授权失败：未收到授权码");
      window.location.href = "/";
      return;
    }

    // 正常流程：用 code 换取 token 并登录
    handleGithubCallback(code);
  }, [searchParams]);

  // GitHub OAuth 回调核心处理函数
  const handleGithubCallback = async (code: string) => {
    try {
      // 调后端 API：code → 后端用 GitHub OAuth App 凭证换 access_token → 创建/查找用户 → 签发 JWT
      const userData = await githubRegister(code);

      // 将 JWT token + 用户信息写入 Zustand store（持久化到 localStorage）
      login({
        token: userData.token,
        refreshToken: userData.refreshToken,
        username: userData.username,
        email: userData.email,
        avatar: userData.avatar,
      });

      toast.success("登录成功");
      // 登录成功后跳转仪表盘（用 window.location 而非 navigate，确保清空回调页的 URL 参数）
      window.location.href = "/app";
    } catch (error: any) {
      // 提取后端返回的错误消息（404/400/500 等不同状态码的消息格式统一处理）
      const errorMessage = error?.response?.data?.message || error?.message || "";

      // === 过期重试分支 ===
      // 检测条件：错误消息包含"过期"关键词 ∧ 重试次数未用完
      if (
        (errorMessage.includes("incorrect or expired") || errorMessage.includes("expired")) &&
        retryCountRef.current < MAX_RETRY_COUNT
      ) {
        retryCountRef.current++;
        // 用 warning 级别 toast 提示用户正在重试
        toast.warning(`授权码已过期，正在重新获取... (${retryCountRef.current}/${MAX_RETRY_COUNT})`);

        try {
          // 重新获取 GitHub 授权 URL（后端生成新的 state 防 CSRF）
          const { url } = await getGithubAuthUrl();
          // 延迟 1 秒跳转：给 toast 足够显示时间，避免用户看到闪烁
          setTimeout(() => {
            window.location.href = url;
          }, 1000);
        } catch {
          // 获取新授权 URL 也失败 → 回退到普通登录页
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 1000);
        }
        return;
      }

      // === 非过期错误（账户不存在/网络错误/服务器错误）→ 记录日志 + 提示 + 回退 ===
      console.error('GitHub 登录失败:', error);
      toast.error(errorMessage || "GitHub 登录失败");
      window.location.href = "/auth/login";
    }
  };

  // 全屏居中 loading 状态：用户从 GitHub 回调回来后会短暂看到此页面
  // 正常情况 1-2 秒内完成 token 换取并跳转，用户几乎感知不到
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {/* 旋转加载圈：4px 蓝色边框 + 顶部透明（通过 border-t-transparent 实现缺口旋转） */}
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">正在处理 GitHub 登录...</p>
      </div>
    </div>
  );
}
