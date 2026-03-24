import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
  MessageSquare,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings2,
  ExternalLink,
  Filter,
} from "lucide-react";
import { AiScreeningSettingsModal } from "./AiScreeningSettingsModal";
import { PreFilterModal } from "./PreFilterModal";
import {
  type PreFilterConfig,
  getDefaultPreFilter,
  isEmptyPreFilter,
} from "./preFilterUtils";
import { loadTemplates } from "../../pages/screeningtemplate/templateApi";
import { getResumes, updateResumeStatus } from "../../api/resume";
import {
  batchScreenResumesWithAi,
  screenResumeWithAi,
  getAiConfigs,
  updateAiConfig,
} from "../../api/ai";
import { logActivity } from "../../api/dashboard";
import type { Resume } from "../../types/resume";
import type { AiConfig } from "../../types/ai";

// 状态筛选类型
type StatusFilter = "all" | "pending" | "passed" | "rejected";

// 与 ResumeList 状态徽章一致
const listStatusStyles = {
  pending: "bg-amber-50 text-amber-800 border border-amber-200/80",
  passed: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
  rejected: "bg-rose-50 text-rose-800 border border-rose-200/80",
};

const listStatusLabels = {
  pending: "待筛选",
  passed: "已通过",
  rejected: "已拒绝",
};

function getInitials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  return t.slice(0, 1).toUpperCase();
}

const SCORE_RING_R = 38;
const SCORE_RING_C = 2 * Math.PI * SCORE_RING_R;

function MatchScoreRing({ score }: { score: number }) {
  const s = Math.min(100, Math.max(0, Math.round(score)));
  const dashOffset = SCORE_RING_C - (s / 100) * SCORE_RING_C;
  return (
    <div
      className="relative mx-auto flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center"
      aria-hidden
    >
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={SCORE_RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-zinc-100"
        />
        <circle
          cx="50"
          cy="50"
          r={SCORE_RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={SCORE_RING_C}
          strokeDashoffset={dashOffset}
          className="text-sky-500 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums tracking-tight text-zinc-900">
          {s}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
          匹配分
        </span>
      </div>
    </div>
  );
}

const LIST_PAGE_SIZE = 10;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// AI 筛选结果类型
interface ScreeningResult {
  resumeId: number;
  recommendation: "pass" | "reject" | "pending";
  score: number;
  reasoning: string;
  resume?: Resume;
}

const mapRecommendationToStatus = (
  recommendation: "pass" | "reject" | "pending",
): Resume["status"] => {
  if (recommendation === "pass") return "passed";
  if (recommendation === "reject") return "rejected";
  return "pending";
};

const mapStatusToRecommendation = (
  status: Resume["status"],
): "pass" | "reject" | "pending" => {
  if (status === "passed") return "pass";
  if (status === "rejected") return "reject";
  return "pending";
};

export function AiScreening() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [screeningResults, setScreeningResults] = useState<
    Map<number, ScreeningResult>
  >(new Map());
  const [screeningResumeId, setScreeningResumeId] = useState<number | null>(
    null,
  );
  const [jobRequirements, setJobRequirements] = useState("");
  const [screeningAll, setScreeningAll] = useState(false);
  const [jobConfigModalOpen, setJobConfigModalOpen] = useState(false);
  const [aiConfigs, setAiConfigs] = useState<AiConfig[]>([]);
  const [selectedAiConfigId, setSelectedAiConfigId] = useState<number | null>(
    null,
  );
  const [loadingAiConfigs, setLoadingAiConfigs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [preFilterConfig, setPreFilterConfig] =
    useState<PreFilterConfig>(getDefaultPreFilter);
  const [preFilterModalOpen, setPreFilterModalOpen] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [phoneExpanded, setPhoneExpanded] = useState(false);
  const [listPage, setListPage] = useState(1);

  const formatDateShort = (dateStr: string) =>
    new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

  const filteredResumes = useMemo(() => {
    let list = resumes;

    // 1. 自定义预筛选
    if (!isEmptyPreFilter(preFilterConfig)) {
      const keywords = preFilterConfig.keywords
        .split(/[,，\s\n]+/)
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      const mode = preFilterConfig.keywordMode;

      list = list.filter((r) => {
        if (keywords.length > 0) {
          const searchable = [
            r.name,
            r.email ?? "",
            r.phone ?? "",
            r.parsedContent ?? "",
            r.summary ?? "",
          ]
            .join(" ")
            .toLowerCase();
          const matches = keywords.filter((kw) => searchable.includes(kw));
          const matchKeywords =
            mode === "and"
              ? matches.length === keywords.length
              : matches.length > 0;
          if (!matchKeywords) return false;
        }

        if (preFilterConfig.minScore != null && r.score != null) {
          if (r.score < preFilterConfig.minScore) return false;
        }

        if (preFilterConfig.dateFrom.trim()) {
          const created = r.createdAt.slice(0, 10);
          if (created < preFilterConfig.dateFrom) return false;
        }
        if (preFilterConfig.dateTo.trim()) {
          const created = r.createdAt.slice(0, 10);
          if (created > preFilterConfig.dateTo) return false;
        }

        return true;
      });
    }

    // 2. 搜索框
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.email && r.email.toLowerCase().includes(q)),
      );
    }

    // 3. 状态
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    return list;
  }, [resumes, searchQuery, statusFilter, preFilterConfig]);

  // 按分数降序排序（高分在前，无分数排在最后）
  const sortedResumes = useMemo(() => {
    return [...filteredResumes].sort((a, b) => {
      const scoreA = a.score ?? screeningResults.get(a.id)?.score ?? -1;
      const scoreB = b.score ?? screeningResults.get(b.id)?.score ?? -1;
      return scoreB - scoreA;
    });
  }, [filteredResumes, screeningResults]);

  const stats = useMemo(
    () => ({
      all: resumes.length,
      pending: resumes.filter((r) => r.status === "pending").length,
      passed: resumes.filter((r) => r.status === "passed").length,
      rejected: resumes.filter((r) => r.status === "rejected").length,
    }),
    [resumes],
  );

  const listTotalPages = Math.max(
    1,
    Math.ceil(sortedResumes.length / LIST_PAGE_SIZE),
  );
  const paginatedResumes = useMemo(
    () =>
      sortedResumes.slice(
        (listPage - 1) * LIST_PAGE_SIZE,
        listPage * LIST_PAGE_SIZE,
      ),
    [sortedResumes, listPage],
  );

  const selectedResume = useMemo(
    () => resumes.find((r) => r.id === selectedResumeId),
    [resumes, selectedResumeId],
  );

  const selectedResult = useMemo((): ScreeningResult | null => {
    if (!selectedResumeId || !selectedResume) return null;
    const fromMap = screeningResults.get(selectedResumeId);
    if (fromMap) return fromMap;
    if (selectedResume.summary) {
      return {
        resumeId: selectedResume.id,
        recommendation: mapStatusToRecommendation(selectedResume.status),
        score: selectedResume.score ?? 50,
        reasoning: selectedResume.summary,
        resume: selectedResume,
      };
    }
    return null;
  }, [selectedResumeId, selectedResume, screeningResults]);

  useEffect(() => {
    setListPage(1);
  }, [searchQuery, statusFilter, preFilterConfig]);

  useEffect(() => {
    setReasoningOpen(Boolean(selectedResult?.reasoning?.trim()));
  }, [selectedResumeId, selectedResult?.reasoning]);

  // 加载简历列表和AI配置，并读取主动应用的模版
  useEffect(() => {
    loadResumes();
    loadAiConfigs();

    // 从模版页面跳转时，可能携带了 active-screening-template
    const activeId = localStorage.getItem("active-screening-template");
    if (activeId) {
      localStorage.removeItem("active-screening-template");
      const templates = loadTemplates();
      const found = templates.find((t) => t.id === activeId);
      if (found) {
        setPreFilterConfig(found.config);
        toast.success(`已应用模版「${found.name}」的筛选条件`);
      }
    }
  }, []);

  const loadAiConfigs = async () => {
    try {
      setLoadingAiConfigs(true);
      const configs = await getAiConfigs();
      setAiConfigs(configs);
      // 默认选择第一个或默认配置
      if (configs.length > 0) {
        const defaultConfig = configs.find((c) => c.isDefault) || configs[0];
        setSelectedAiConfigId(defaultConfig.id);
        // 如果默认配置有 prompt，则自动填充岗位要求
        if (defaultConfig.prompt) {
          setJobRequirements(defaultConfig.prompt);
        }
      }
    } catch (error) {
      console.error("加载AI配置失败:", error);
    } finally {
      setLoadingAiConfigs(false);
    }
  };

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await getResumes();
      setResumes(data);
    } catch (error) {
      console.error("加载简历失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 选择简历
  const handleSelectResume = (resumeId: number) => {
    setSelectedResumeId(resumeId);
  };

  const getResumeFileUrl = (resume: Resume) => {
    if (!resume.resumeFile) return;
    const fullPath = resume.resumeFile;
    const relativePath = fullPath
      .replace(/^.*[\\/]uploads[\\/]/, "uploads/")
      .replace(/\\/g, "/");
    return `${API_BASE_URL}/${relativePath}`;
  };

  const openResumeInNewWindow = (resume: Resume) => {
    const url = getResumeFileUrl(resume);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpdateStatus = async (
    resumeId: number,
    status: "pending" | "passed" | "rejected",
  ) => {
    const resume = resumes.find((r) => r.id === resumeId);
    try {
      await updateResumeStatus(resumeId, status);
      setResumes((prev) =>
        prev.map((r) => (r.id === resumeId ? { ...r, status } : r)),
      );
      if (status === "passed") {
        await logActivity({
          type: "pass",
          resumeId,
          resumeName: resume?.name ?? undefined,
          description: "通过初筛",
        });
      } else if (status === "rejected") {
        await logActivity({
          type: "reject",
          resumeId,
          resumeName: resume?.name ?? undefined,
          description: "未通过筛选",
        });
      }
    } catch (error) {
      console.error("更新状态失败:", error);
    }
  };

  // 筛选单个简历
  const handleScreenResume = async (resumeId: number) => {
    if (!jobRequirements.trim()) {
      toast.error("请输入岗位要求");
      return;
    }

    if (!selectedAiConfigId) {
      toast.error("请选择 AI 配置");
      return;
    }

    try {
      setScreeningResumeId(resumeId);
      const result = await screenResumeWithAi({
        resumeId,
        jobRequirements,
        aiConfigId: selectedAiConfigId,
      });

      const resume = resumes.find((r) => r.id === resumeId);

      if (resume) {
        // 把 AI 结果写回本地简历列表，保持与后端 summary/status/score 对齐
        setResumes((prev) =>
          prev.map((r) =>
            r.id === resumeId
              ? {
                  ...r,
                  summary: result.reasoning,
                  status: mapRecommendationToStatus(result.recommendation),
                  score: result.score,
                }
              : r,
          ),
        );
      }

      setScreeningResults((prev) => {
        const newMap = new Map(prev);
        newMap.set(resumeId, { ...result, resumeId, resume });
        return newMap;
      });

      await logActivity({
        type: "screening",
        resumeId,
        resumeName: resume?.name ?? undefined,
        description: result.reasoning ?? undefined,
      });

      await loadResumes();

      // 保存岗位要求到 AI 配置
      try {
        await updateAiConfig(selectedAiConfigId!, { prompt: jobRequirements });
        // 更新本地配置列表中的 prompt
        setAiConfigs((prev) =>
          prev.map((config) =>
            config.id === selectedAiConfigId
              ? { ...config, prompt: jobRequirements }
              : config,
          ),
        );
      } catch (saveError) {
        console.error("保存岗位要求到AI配置失败:", saveError);
      }
    } catch (error) {
      console.error("AI筛选失败:", error);
      toast.error("AI 筛选失败，请重试");
    } finally {
      setScreeningResumeId(null);
    }
  };

  // 批量筛选
  const handleBatchScreen = async () => {
    if (!jobRequirements.trim()) {
      toast.error("请输入岗位要求");
      return;
    }

    if (!selectedAiConfigId) {
      toast.error("请选择 AI 配置");
      return;
    }

    const toScreen = sortedResumes;
    if (toScreen.length === 0) {
      toast.error("当前筛选结果为空，无可筛简历");
      return;
    }

    try {
      setScreeningAll(true);
      const results = await batchScreenResumesWithAi({
        resumeIds: toScreen.map((r) => r.id),
        jobRequirements,
        aiConfigId: selectedAiConfigId,
      });

      // 批量更新本地简历列表中的 summary/status/score，保持与后端一致
      setResumes((prev) =>
        prev.map((r) => {
          const item = results.find(
            (res) => res.resumeId === r.id && res.success && res.result,
          );
          if (!item || !item.result) return r;
          return {
            ...r,
            summary: item.result.reasoning,
            status: mapRecommendationToStatus(item.result.recommendation),
            score: item.result.score,
          };
        }),
      );

      setScreeningResults((prev) => {
        const newMap = new Map(prev);
        results.forEach((item) => {
          if (item.success && item.result) {
            const resume = toScreen.find((r) => r.id === item.resumeId);
            newMap.set(item.resumeId, {
              ...item.result,
              resumeId: item.resumeId,
              resume,
            });
          }
        });
        return newMap;
      });

      await Promise.all(
        results
          .filter((item) => item.success && item.result)
          .map((item) => {
            const r = toScreen.find((res) => res.id === item.resumeId);
            return logActivity({
              type: "screening",
              resumeId: item.resumeId,
              resumeName: r?.name ?? undefined,
              description: item.result!.reasoning ?? undefined,
            });
          }),
      );

      await loadResumes();

      // 保存岗位要求到 AI 配置
      try {
        await updateAiConfig(selectedAiConfigId!, { prompt: jobRequirements });
        // 更新本地配置列表中的 prompt
        setAiConfigs((prev) =>
          prev.map((config) =>
            config.id === selectedAiConfigId
              ? { ...config, prompt: jobRequirements }
              : config,
          ),
        );
      } catch (saveError) {
        console.error("保存岗位要求到AI配置失败:", saveError);
      }
    } catch (error) {
      console.error("批量筛选失败:", error);
      toast.error("批量筛选失败，请重试");
    } finally {
      setScreeningAll(false);
    }
  };

  return (
    <div className="relative flex min-h-full flex-col">
      <PreFilterModal
        open={preFilterModalOpen}
        onClose={() => setPreFilterModalOpen(false)}
        config={preFilterConfig}
        onConfigChange={setPreFilterConfig}
        onApply={() => {}}
      />

      <AiScreeningSettingsModal
        open={jobConfigModalOpen}
        onClose={() => setJobConfigModalOpen(false)}
        jobRequirements={jobRequirements}
        onJobRequirementsChange={setJobRequirements}
        aiConfigs={aiConfigs}
        loadingAiConfigs={loadingAiConfigs}
        selectedAiConfigId={selectedAiConfigId}
        onSelectConfigId={(configId) => {
          setSelectedAiConfigId(configId);
          const cfg = aiConfigs.find((c) => c.id === configId);
          if (cfg?.prompt) setJobRequirements(cfg.prompt);
        }}
        onBatchScreen={handleBatchScreen}
        screeningAll={screeningAll}
        batchDisabled={
          screeningAll ||
          sortedResumes.length === 0 ||
          !selectedAiConfigId ||
          !jobRequirements.trim()
        }
      />

      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]"
        aria-hidden
      />

      <div className="mx-auto flex min-h-0 max-w-[1360px] flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              AI Screening
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
              AI 智能筛选
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-500">
              左侧选人，右侧决策；先配置岗位与模型，再对单人运行 AI
              筛选或批量处理。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-zinc-200/80 bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600 shadow-sm">
                共 {stats.all} 份
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200/60">
                待筛选 {stats.pending}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200/60">
                已通过 {stats.passed}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJobConfigModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/50 hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 lg:self-auto"
          >
            <Settings2 className="h-4 w-4 text-zinc-500" aria-hidden />
            岗位与 AI 配置
          </button>
        </header>

        <section
          className="flex min-h-[min(640px,calc(100vh-10rem))] flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.1)] ring-1 ring-zinc-950/[0.03] backdrop-blur-sm"
          aria-label="AI 筛选工作台"
        >
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
            <aside className="flex min-h-[min(400px,48vh)] flex-col border-b border-zinc-200/70 bg-gradient-to-b from-zinc-50/90 to-zinc-50/40 min-w-0 lg:col-span-4 lg:min-h-0 lg:border-b-0 lg:border-r lg:border-zinc-200/70">
              <div className="shrink-0 border-b border-zinc-200/60 px-4 pb-3 pt-4">
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    候选人
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreFilterModalOpen(true)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-1 ${
                        isEmptyPreFilter(preFilterConfig)
                          ? "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                          : "bg-violet-100 text-violet-800 ring-1 ring-violet-200/80"
                      }`}
                    >
                      <Filter className="h-3.5 w-3.5" aria-hidden />
                      自定义条件
                      {!isEmptyPreFilter(preFilterConfig) && (
                        <span className="tabular-nums" aria-hidden>
                          ✓
                        </span>
                      )}
                    </button>
                    <span className="tabular-nums text-xs text-zinc-500">
                      {filteredResumes.length} 条
                      {statusFilter !== "all" ||
                      searchQuery.trim() ||
                      !isEmptyPreFilter(preFilterConfig)
                        ? " · 已筛选"
                        : ""}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    placeholder="搜索姓名或邮箱"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full rounded-xl border border-zinc-200/90 bg-white pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-shadow focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200/80"
                    aria-label="搜索候选人"
                  />
                </div>
              </div>

              <div
                className="shrink-0 border-b border-zinc-200/60 px-3 py-2.5"
                role="group"
                aria-label="按状态筛选"
              >
                <div className="-mx-1 flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                  {(
                    [
                      { key: "all" as const, label: "全部" },
                      { key: "pending" as const, label: "待筛选" },
                      { key: "passed" as const, label: "已通过" },
                      { key: "rejected" as const, label: "已拒绝" },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={statusFilter === key ? "true" : "false"}
                      onClick={() => setStatusFilter(key)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all sm:text-[13px] ${
                        statusFilter === key
                          ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/15"
                          : "bg-white/80 text-zinc-600 ring-1 ring-zinc-200/80 hover:bg-white hover:text-zinc-900"
                      }`}
                    >
                      {label}{" "}
                      <span className="tabular-nums opacity-80">
                        {key === "all" ? stats.all : stats[key]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
                {loading ? (
                  <ul
                    className="space-y-2 p-1"
                    aria-busy="true"
                    aria-label="加载中"
                  >
                    {Array.from({ length: 7 }).map((_, i) => (
                      <li
                        key={i}
                        className="h-[4.25rem] animate-pulse rounded-xl bg-zinc-200/40"
                      />
                    ))}
                  </ul>
                ) : filteredResumes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
                      <FileText
                        className="h-6 w-6 text-zinc-400"
                        strokeWidth={1.5}
                      />
                    </div>
                    <p className="text-sm font-semibold text-zinc-800">
                      {resumes.length === 0
                        ? "还没有简历"
                        : "没有符合条件的候选人"}
                    </p>
                    <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-zinc-500">
                      {resumes.length === 0
                        ? "上传后即可在此用 AI 初筛"
                        : "调整搜索、状态或自定义条件试试"}
                    </p>
                    {resumes.length === 0 && (
                      <Link
                        to="/app/resumes"
                        className="mt-5 inline-flex items-center rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                      >
                        前往简历管理
                      </Link>
                    )}
                  </div>
                ) : (
                  <ul
                    role="listbox"
                    aria-label="候选人列表"
                    className="flex flex-col gap-1.5 p-1"
                  >
                    {paginatedResumes.map((resume) => {
                      const scoreVal =
                        resume.score ??
                        screeningResults.get(resume.id)?.score ??
                        null;
                      const selected = selectedResumeId === resume.id;
                      return (
                        <li
                          key={resume.id}
                          id={`candidate-${resume.id}`}
                          role="option"
                          tabIndex={0}
                          aria-selected={selected ? "true" : "false"}
                          onClick={() => handleSelectResume(resume.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelectResume(resume.id);
                            }
                          }}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
                            selected
                              ? "border-sky-200 bg-white shadow-md shadow-sky-900/5 ring-1 ring-sky-100"
                              : "border-transparent bg-white/40 hover:border-zinc-200/80 hover:bg-white/90"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                              selected
                                ? "bg-sky-600 text-white"
                                : "bg-zinc-200/80 text-zinc-600"
                            }`}
                            aria-hidden
                          >
                            {getInitials(resume.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-900">
                              {resume.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                              {resume.phone || "无电话"}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {scoreVal != null && (
                              <span
                                className={`rounded-lg px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                                  scoreVal >= 80
                                    ? "bg-sky-100 text-sky-800"
                                    : scoreVal >= 60
                                      ? "bg-amber-100 text-amber-900"
                                      : "bg-zinc-100 text-zinc-700"
                                }`}
                              >
                                {scoreVal}%
                              </span>
                            )}
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${listStatusStyles[resume.status]}`}
                            >
                              {listStatusLabels[resume.status]}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {!loading && filteredResumes.length > 0 && (
                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-200/70 bg-white/90 px-3 py-2.5 backdrop-blur-sm">
                  <span className="text-xs tabular-nums text-zinc-500">
                    {listTotalPages > 1
                      ? `第 ${listPage} / ${listTotalPages} 页 · ${filteredResumes.length} 条`
                      : `${filteredResumes.length} 条`}
                  </span>
                  {listTotalPages > 1 && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setListPage((p) => Math.max(1, p - 1))}
                        disabled={listPage <= 1}
                        className="rounded-lg border border-zinc-200/90 bg-white p-2 text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-35"
                        aria-label="上一页"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setListPage((p) => Math.min(listTotalPages, p + 1))
                        }
                        disabled={listPage >= listTotalPages}
                        className="rounded-lg border border-zinc-200/90 bg-white p-2 text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-35"
                        aria-label="下一页"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </aside>

            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white lg:col-span-8">
              {!selectedResume ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
                  <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-100 to-sky-50 shadow-inner ring-1 ring-sky-100">
                    <Sparkles
                      className="h-11 w-11 text-sky-500"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-base font-semibold text-zinc-800">
                    选择一位候选人
                  </p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
                    在左侧列表中选中简历后，可查看联系方式、匹配分与 AI
                    评估，并在此做出筛选决策。
                  </p>
                  <button
                    type="button"
                    onClick={() => setJobConfigModalOpen(true)}
                    className="mt-8 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <Settings2 className="h-4 w-4" />
                    先配置岗位与 AI
                  </button>
                </div>
              ) : (
                <>
                  <div className="sticky top-0 z-10 shrink-0 border-b border-zinc-200/70 bg-white/90 px-4 py-4 shadow-sm shadow-zinc-900/[0.03] backdrop-blur-md supports-[backdrop-filter]:bg-white/80 sm:px-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
                            {selectedResume.name}
                          </h2>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${listStatusStyles[selectedResume.status]}`}
                          >
                            {listStatusLabels[selectedResume.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                          导入时间 {formatDateShort(selectedResume.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedResume.resumeFile && (
                          <button
                            type="button"
                            onClick={() =>
                              openResumeInNewWindow(selectedResume)
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                          >
                            <ExternalLink className="h-4 w-4 text-zinc-400" />
                            打开简历
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setJobConfigModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                        >
                          <Settings2 className="h-4 w-4 text-zinc-400" />
                          AI 与岗位
                        </button>
                        {selectedResumeId != null && (
                          <button
                            type="button"
                            onClick={() => handleScreenResume(selectedResumeId)}
                            disabled={
                              screeningResumeId === selectedResumeId ||
                              !jobRequirements.trim()
                            }
                            title={
                              !jobRequirements.trim()
                                ? "请先在「岗位与 AI 配置」中填写岗位要求"
                                : undefined
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-sky-500 to-sky-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-sky-600/25 transition-all hover:from-sky-600 hover:to-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45"
                          >
                            {screeningResumeId === selectedResumeId ? (
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <Sparkles className="h-4 w-4" aria-hidden />
                            )}
                            AI 筛选
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                    <div className="mx-auto max-w-3xl space-y-5">
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
                        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/40 p-5 shadow-sm">
                          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-100">
                              <User className="h-4 w-4 text-zinc-500" />
                            </span>
                            基本信息
                          </h3>
                          <dl className="space-y-3 text-sm">
                            <div>
                              <dt className="text-xs font-medium text-zinc-400">
                                邮箱
                              </dt>
                              <dd className="mt-0.5 break-all text-zinc-800">
                                {selectedResume.email || "—"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-zinc-400">
                                电话
                              </dt>
                              <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-zinc-800">
                                {selectedResume.phone
                                  ? phoneExpanded
                                    ? selectedResume.phone
                                    : selectedResume.phone.length > 7
                                      ? `${selectedResume.phone.slice(0, 3)}****${selectedResume.phone.slice(-4)}`
                                      : "***"
                                  : "—"}
                                {selectedResume.phone &&
                                  selectedResume.phone.length > 7 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setPhoneExpanded((v) => !v)
                                      }
                                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 focus-visible:outline-none focus-visible:underline"
                                    >
                                      {phoneExpanded ? "收起" : "显示全文"}
                                    </button>
                                  )}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <div className="rounded-2xl border border-zinc-200/70 bg-gradient-to-br from-sky-50/50 via-white to-zinc-50/30 p-5 shadow-sm">
                          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-sky-100">
                              <BarChart3 className="h-4 w-4 text-sky-600" />
                            </span>
                            匹配度
                          </h3>
                          {selectedResult ? (
                            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                              <MatchScoreRing score={selectedResult.score} />
                              <div className="min-w-0 flex-1 text-center sm:text-left">
                                <p className="text-xs font-medium text-zinc-500">
                                  维度参考（示意）
                                </p>
                                <p className="mt-2 text-sm text-zinc-700">
                                  <span className="font-semibold text-zinc-900">
                                    技能
                                  </span>{" "}
                                  {Math.min(selectedResult.score + 5, 100)}%
                                  <span className="mx-2 text-zinc-300">·</span>
                                  <span className="font-semibold text-zinc-900">
                                    学历
                                  </span>{" "}
                                  {Math.max(selectedResult.score - 25, 0)}%
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-6 text-center">
                              <p className="text-sm text-zinc-500">
                                尚未生成匹配分
                              </p>
                              <p className="mt-1 text-xs text-zinc-400">
                                点击右上角「AI 筛选」运行模型
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={() => setReasoningOpen((v) => !v)}
                          aria-expanded={reasoningOpen ? "true" : "false"}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                            <MessageSquare className="h-4 w-4 shrink-0 text-violet-500" />
                            AI 评估理由
                          </span>
                          {reasoningOpen ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-zinc-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                          )}
                        </button>
                        {reasoningOpen && (
                          <div className="border-t border-zinc-100 bg-zinc-50/30 px-4 py-4 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                            {selectedResult?.reasoning?.trim() ||
                              "暂无评估内容。完成 AI 筛选后将在此展示模型结论。"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-200/80 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.08)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedResume.id, "pending")
                      }
                      className="rounded-xl border border-zinc-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                    >
                      待定
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedResume.id, "rejected")
                      }
                      className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-600/20 transition-colors hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                    >
                      拒绝
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedResume.id, "passed")
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      通过
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>
        </section>
      </div>
    </div>
  );
}
