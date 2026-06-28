/**
 * 登录页 (路由: /)
 * 登录/注册双标签切换 + GitHub OAuth 入口
 *
 * ## 页面布局（左右分栏，1024px 以上生效）
 *   左侧（品牌区）：Logo + Slogan + 特性列表 + 统计数据 + 版权
 *   右侧（表单区）：登录/注册 Tab 切换器 + 带滑入动画的表单卡片
 *
 * ## 标签切换动画原理
 *   isLogin 切换 → animKey 递增 → React key 变化 → 旧组件卸载，新组件挂载
 *   → CSS 类名 "entering-from-left" / "entering" 控制 translateX 方向
 *   → 登录：从左侧滑入（←） / 注册：从右侧滑入（→）
 *
 * ## 认证状态
 *   已登录（store 中有 token）→ 自动跳转 /app，不渲染登录页
 *   未登录 → 正常显示登录/注册表单
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLoginStore } from "../../store/Login";
import toast from "../../utils/toast";
import { LoginForm, RegisterForm } from "../../components/login";
import { CheckCircle2 } from "lucide-react";

// 左侧品牌区展示的产品特性列表（4 条，带绿色对勾图标）
const FEATURES = [
  "智能解析简历，快速提取关键信息",
  "多维度匹配岗位，提升筛选精准度",
  "批量处理候选人，节省招聘时间",
  "数据安全可控，助力合规招聘流程",
];

// 左侧品牌区展示的统计数据（营销数字，增强信任感）
const STATS = [
  { value: "10K+", label: "已处理简历" },
  { value: "98.6%", label: "匹配准确率" },
  { value: "3.2x", label: "效率提升" },
];

export default function AuthPage() {
  // 当前是否为登录模式（false = 注册模式）
  const [isLogin, setIsLogin] = useState(true);
  // 动画 key：每次切换标签时 +1，触发 React 重新挂载表单组件以播放入场动画
  const [animKey, setAnimKey] = useState(0);
  const navigate = useNavigate();
  // URL 查询参数，用于处理 ?redirect=unauthorized 等场景
  const [searchParams] = useSearchParams();
  // 从 Zustand store 读取登录 Token，非空 = 已登录
  const { token } = useLoginStore();

  // 已登录用户访问登录页 → 自动重定向到仪表盘（replace 替换历史记录，阻止回退到登录页）
  useEffect(() => {
    if (token) navigate("/app", { replace: true });
  }, [token, navigate]);

  // 检测未授权重定向：路由守卫拦截后将用户带到登录页，此处弹出提示告知原因
  useEffect(() => {
    if (searchParams.get("redirect") === "unauthorized") {
      toast.error("请先登录后再访问");
    }
  }, [searchParams]);

  // 切换登录/注册标签：相同模式不处理，不同模式递增 animKey 后更新 isLogin
  const handleSwitchTab = (val: boolean) => {
    if (val === isLogin) return;       // 重复点击同一标签不触发动画
    setAnimKey((k) => k + 1);          // 先递增 key（触发旧组件卸载）
    setIsLogin(val);                   // 再切换模式（React 会用新 key 挂载新组件）
  };

  // 动画方向判断：切换到登录 → 表单从左侧滑入 / 切换到注册 → 表单从右侧滑入
  const enterFromLeft = isLogin;

  return (
    <div className="login-root">
      {/* 全屏圆点网格背景（纯装饰，不响应鼠标事件） */}
      <div className="login-grid-bg" aria-hidden />

      {/* 居中主卡片：左侧品牌区 + 右侧表单区，毛玻璃质感 */}
      <div className="login-card">
        {/* ── 左侧品牌区（深色背景，渐变填充） ── */}
        <aside className="login-brand">
          <div className="login-brand-inner">
            {/* Logo 区：层叠纸片图标 + 产品名称 */}
            <div className="login-brand-logo">
              <div className="login-logo-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  aria-hidden
                >
                  {/* 三层纸片图标：模拟简历堆叠效果 */}
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="login-brand-name">AI Resume Screening</span>
            </div>

            {/* Slogan 标题：主标题 + 副标题 */}
            <div className="login-brand-headline">
              <h1>
                用 AI 重新定义
                <br />
                简历筛选体验
              </h1>
              <p>智能解析 · 精准匹配 · 高效协同，让每一份人才都被认真对待</p>
            </div>

            {/* 产品特性列表：白色半透明背景 + 绿色对勾图标 */}
            <ul className="login-features">
              {FEATURES.map((text) => (
                <li key={text} className="login-feature-item">
                  {/* 对勾图标：绿色半透明圆心 + 白色 SVG */}
                  <div className="login-feature-icon">
                    <CheckCircle2 size={11} color="rgba(255,255,255,0.9)" aria-hidden />
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            {/* 底部数据统计：三列数字（10K+ / 98.6% / 3.2x），增强品牌可信度 */}
            <div className="login-stats">
              {STATS.map((s) => (
                <div key={s.label} className="login-stat-item">
                  <span className="login-stat-value">{s.value}</span>
                  <span className="login-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 底部版权信息（动态年份，始终当前年份） */}
          <p className="login-brand-footer">
            © {new Date().getFullYear()} AI Resume Screening
          </p>
        </aside>

        {/* ── 右侧表单区（浅色背景） ── */}
        <div className="login-form-panel">
          {/* Tab 切换器：登录 / 注册，下方滑动指示器跟随 active tab 移动 */}
          <div className="login-tab-nav" role="tablist" aria-label="登录方式">
            {/* 滑动指示条：绝对定位，data-pos="left"|"right" 通过 CSS 变量控制 left 位置 */}
            <div
              className="login-tab-slider"
              data-pos={isLogin ? "left" : "right"}
              aria-hidden
            />
            {/* 登录标签按钮 */}
            <button
              role="tab"
              aria-selected={isLogin ? "true" : "false"}
              tabIndex={isLogin ? 0 : -1}
              onClick={() => handleSwitchTab(true)}
              className={`login-tab-item ${isLogin ? "login-tab-active" : ""}`}
            >
              登录
            </button>
            {/* 注册标签按钮 */}
            <button
              role="tab"
              aria-selected={!isLogin ? "true" : "false"}
              tabIndex={!isLogin ? 0 : -1}
              onClick={() => handleSwitchTab(false)}
              className={`login-tab-item ${!isLogin ? "login-tab-active" : ""}`}
            >
              注册
            </button>
          </div>

          {/* 表单区域：根据 isLogin 切换 LoginForm / RegisterForm，带滑入动画 */}
          <div className="login-form-area">
            {isLogin ? (
              <div
                // key 变化 → React 卸载旧组件 + 挂载新组件 → CSS 动画重播
                key={`login-${animKey}`}
                className={`login-form-card ${enterFromLeft ? "entering-from-left" : "entering"}`}
              >
                <LoginForm />
              </div>
            ) : (
              <div
                key={`register-${animKey}`}
                className={`login-form-card ${enterFromLeft ? "entering" : "entering-from-left"}`}
              >
                {/* 注册成功后自动切回登录标签 */}
                <RegisterForm onSuccess={() => handleSwitchTab(true)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
