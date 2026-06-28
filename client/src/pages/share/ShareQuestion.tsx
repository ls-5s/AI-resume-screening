/**
 * 面试题分享页 (路由: /share/:data)
 * 外部查看 AI 生成的面试题，无需登录
 *
 * ## 页面用途
 *   面试题生成页（InterviewQuestions.tsx）通过"分享"按钮生成加密链接，
 *   接收方打开链接即可查看 AI 生成的面试题，无需登录系统。
 *   典型场景：HR 生成面试题 → 分享给面试官 → 面试官直接查看题目清单
 *
 * ## URL 编码方案
 *   分享数据经过三层编码后拼在 URL path 中（:data 参数）：
 *     1. JSON.stringify(payload)           — 序列化为 JSON 字符串
 *     2. btoa(unescape(encodeURIComponent)) — Base64 编码（含中文支持）
 *     3. .replace(/\+/g, "-") 等            — base64url 安全转换（+→-, /→_, 去=）
 *
 *   解码时逆向操作（decodeShareData）：
 *     base64url → 标准 Base64 → atob → decodeURIComponent → JSON.parse
 *
 * ## 页面状态（三态）
 *   1. 无 :data 参数 → "链接无效"（URL 不完整）
 *   2. :data 存在但解码失败 → "无法解析分享内容"（数据损坏或被篡改）
 *   3. 解码成功 → 正常展示面试题列表 + 顶部操作栏
 */

import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Copy,
  Check,
  BookOpen,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { InterviewQuestion } from "../../types/ai";

// 分享链接中携带的数据结构（与 InterviewQuestions.tsx 中的 buildShareUrl 一致）
interface ShareData {
  questions: InterviewQuestion[];  // 结构化面试题数组
  summary?: string;                 // AI 生成的考察重点摘要
  candidateName?: string;           // 候选人姓名（文档标题用）
  resumePreview?: string;           // 简历内容前 200 字符（供接收方快速了解候选人背景）
}

/**
 * 解码 base64url 格式的分享数据
 *
 * 步骤（与编码时逆向对应）：
 *   1. base64url → 标准 Base64：- 还原为 +、_ 还原为 /
 *   2. atob → 原始二进制字符串（latin1 编码的 UTF-8 字节序列）
 *   3. decodeURIComponent(escape(...)) → UTF-8 字符串 → JSON.parse → ShareData 对象
 *
 * 任何一步失败都返回 null（链接已损坏或被手动修改）
 */
function decodeShareData(encoded: string): ShareData | null {
  try {
    // 还原 base64url 安全字符为标准 Base64
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    // atob → escape → decodeURIComponent 三步解码（支持中文字符）
    const decoded = decodeURIComponent(escape(atob(padded)));
    return JSON.parse(decoded) as ShareData;
  } catch {
    return null; // 解码失败 → 上层显示"无法解析分享内容"
  }
}

export default function ShareQuestion() {
  // 从 URL path 中提取 base64url 编码的分享数据
  // 例如 /share/eyJxdWVzdGlvbnMiOl... → encoded = "eyJxdWVzdGlvbnMiOl..."
  const { data: encoded } = useParams<{ data: string }>();

  // 复制全部按钮的状态（点击后显示绿色"已复制"2 秒）
  const [copiedAll, setCopiedAll] = useState(false);

  // 用 useMemo 缓存解码结果：encoded 不变时不会重复解码
  // encoded 为空 → null（触发"链接无效"态）
  // 解码失败 → null（触发"无法解析"态）
  const decoded = useMemo(
    () => (encoded ? decodeShareData(encoded) : null),
    [encoded],
  );

  // 复制全部题目到剪贴板（格式：1. 题目一\n\n2. 题目二\n\n...）
  const handleCopyAll = () => {
    if (!decoded) return;
    // 只复制问题文本，不包含 category 等元信息
    const blocks = decoded.questions.map(
      (q, i) => `${i + 1}. ${q.question}`,
    );
    navigator.clipboard.writeText(blocks.join("\n\n")).then(() => {
      setCopiedAll(true);
      // 2 秒后恢复为"复制全部"按钮
      setTimeout(() => setCopiedAll(false), 2000);
    });
  };

  // ===== 态 1：URL 中没有 :data 参数（路由匹配异常） =====
  if (!encoded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="text-center">
          {/* 灰色警示图标：非严重错误，用中性色 */}
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
          <h1 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">
            链接无效
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            此面试题链接已失效或格式不正确
          </p>
        </div>
      </div>
    );
  }

  // ===== 态 2：编码数据存在但解码失败（数据损坏/被篡改） =====
  if (!decoded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="text-center">
          {/* 红色警示图标：数据异常，用红色引起注意 */}
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-300" />
          <h1 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">
            无法解析分享内容
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            该链接数据已损坏，请重新生成分享链接
          </p>
        </div>
      </div>
    );
  }

  // ===== 态 3：解码成功，正常展示 =====
  const { questions, candidateName } = decoded;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* 顶部导航栏：sticky 吸顶 + 毛玻璃模糊背景 */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          {/* 左侧品牌标识：紫蓝渐变图标 + 标题 + 候选人姓名 */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-sm">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                AI 面试题
              </h1>
              {candidateName && (
                <p className="text-xs text-zinc-400">候选人：{candidateName}</p>
              )}
            </div>
          </div>

          {/* 右侧操作按钮组 */}
          <div className="flex items-center gap-2">
            {/* 复制全部按钮：点击后临时切换为绿色"已复制"状态 */}
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm transition-colors hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
            >
              {copiedAll ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  复制全部
                </>
              )}
            </button>
            {/* 试用入口：引导外部用户了解产品（外链跳转到首页） */}
            <a
              href="/"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 shadow-sm transition-colors hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-200"
            >
              <ExternalLink className="h-4 w-4" />
              试用 AIScaning
            </a>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* 页面标题栏：大标题 + 候选人标注 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            AI 生成的面试题
          </h2>
          {candidateName && (
            <p className="mt-1 text-sm text-zinc-500">
              为候选人「{candidateName}」定制
            </p>
          )}
        </div>

        {/* 面试题文档卡片：白色圆角容器，模拟打印文档样式 */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* 文档标题：居中显示"面试题" + 候选人 */}
          <div className="border-b border-zinc-200 p-6 text-center dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              面试题
            </h3>
            {candidateName && (
              <p className="mt-1 text-sm text-zinc-500">候选人：{candidateName}</p>
            )}
          </div>

          {/* 题目列表：紫色编号 + 类别标签 + 题目文本 */}
          <div className="p-6">
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50"
                >
                  {/* 题目头部：紫色序号方块 + 类别标签（技术能力/行为面试/项目经验等） */}
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-purple-500 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    {question.category && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        {question.category}
                      </span>
                    )}
                  </div>
                  {/* 题目正文：左侧缩进 32px（pl-8）与编号对齐 */}
                  <p className="pl-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {question.question}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 文档页脚：品牌水印 */}
          <div className="border-t border-zinc-200 p-4 text-center dark:border-zinc-800">
            <p className="text-xs text-zinc-400">
              由 AIScaning 面试题生成器制作
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
