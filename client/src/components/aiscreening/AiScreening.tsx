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
import { AiReasoningContent } from "./AiReasoningContent";
import {
  type PreFilterConfig,
  getDefaultPreFilter,
  isEmptyPreFilter,
} from "./preFilterUtils";
import {
  getTemplate,
  loadTemplates,
} from "../../api/screeningTemplate";
import {
  getResumes,
  getFilteredResumes,
  updateResumeStatus,
} from "../../api/resume";
import {
  batchScreenResumesWithAi,
  screenResumeWithAi,
  getAiConfigs,
  updateAiConfig,
} from "../../api/ai";
import { logActivity } from "../../api/dashboard";
import type { Resume } from "../../types/resume";
import type { AiConfig } from "../../types/ai";

type StatusFilter = "all" | "pending" | "passed" | "rejected";

const STATUS_META = {
  pending: {
    badge: "bg-blue-50 text-blue-500 border border-blue-200",
    dot: "bg-blue-300",
    label: "待筛选",
    icon: "⏳",
  },
  passed: {
    badge: "bg-blue-600 text-white border border-blue-600",
    dot: "bg-blue-200",
    label: "已通过",
    icon: "✓",
  },
  rejected: {
    badge: "bg-white text-blue-400 border border-blue-200",
    dot: "bg-blue-200",
    label: "已拒绝",
    icon: "✗",
  },
} as const;

const listStatusStyles = {
  pending: STATUS_META.pending.badge,
  passed: STATUS_META.passed.badge,
  rejected: STATUS_META.rejected.badge,
};
const listStatusLabels = {
  pending: STATUS_META.pending.label,
  passed: STATUS_META.passed.label,
  rejected: STATUS_META.rejected.label,
};

function getInitials(name: string) {
  const t = name.trim();
  if (!t) return "?";
  return t.slice(0, 1).toUpperCase();
}

const SCORE_RING_R = 36;
const SCORE_RING_C = 2 * Math.PI * SCORE_RING_R;

function getScoreColor(s: number) {
  if (s >= 80) return { stroke: "#2563eb", text: "text-blue-700", gradeBg: "bg-blue-600 text-white", grade: "优秀" };
  if (s >= 60) return { stroke: "#60a5fa", text: "text-blue-500", gradeBg: "bg-blue-100 text-blue-700", grade: "良好" };
  return { stroke: "#bfdbfe", text: "text-blue-300", gradeBg: "bg-blue-50 text-blue-400", grade: "待定" };
}

function MatchScoreRing({ score }: { score: number }) {
  const s = Math.min(100, Math.max(0, Math.round(score)));
  const dashOffset = SCORE_RING_C - (s / 100) * SCORE_RING_C;
  const { stroke, text, gradeBg, grade } = getScoreColor(s);
  return (
    <div className="flex flex-col items-center gap-2" aria-hidden>
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={SCORE_RING_R} fill="none" stroke="#dbeafe" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={SCORE_RING_R} fill="none"
            stroke={stroke} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={SCORE_RING_C}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-[2rem] font-black tabular-nums leading-none ${text}`}>{s}</span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">分</span>
        </div>
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${gradeBg}`}>{grade}</span>
    </div>
  );
}

const LIST_PAGE_SIZE = 10;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
  const [screeningResults, setScreeningResults] = useState<Map<number, ScreeningResult>>(new Map());
  const [screeningResumeId, setScreeningResumeId] = useState<number | null>(null);
  const [jobRequirements, setJobRequirements] = useState("");
  const [screeningAll, setScreeningAll] = useState(false);
  const [jobConfigModalOpen, setJobConfigModalOpen] = useState(false);
  const [aiConfigs, setAiConfigs] = useState<AiConfig[]>([]);
  const [selectedAiConfigId, setSelectedAiConfigId] = useState<number | null>(null);
  const [loadingAiConfigs, setLoadingAiConfigs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [preFilterConfig, setPreFilterConfig] = useState<PreFilterConfig>(getDefaultPreFilter);
  const [preFilterModalOpen, setPreFilterModalOpen] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [phoneExpanded, setPhoneExpanded] = useState(false);
  const [listPage, setListPage] = useState(1);

  const formatDateShort = (dateStr: string) =>
    new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });

  const filteredResumes = useMemo(() => {
    let list = resumes;
    if (!isEmptyPreFilter(preFilterConfig)) {
      const keywords = preFilterConfig.keywords
        .split(/[,，\s\n]+/).map((k) => k.trim().toLowerCase()).filter(Boolean);
      const mode = preFilterConfig.keywordMode;
      list = list.filter((r) => {
        if (keywords.length > 0) {
          const searchable = [r.name, r.email ?? "", r.phone ?? "", r.parsedContent ?? "", r.summary ?? ""]
            .join(" ").toLowerCase();
          const matches = keywords.filter((kw) => searchable.includes(kw));
          const matchKeywords = mode === "and" ? matches.length === keywords.length : matches.length > 0;
          if (!matchKeywords) return false;
        }
        if (preFilterConfig.minScore != null && r.score != null && r.score < preFilterConfig.minScore) return false;
        if (preFilterConfig.dateFrom.trim() && r.createdAt.slice(0, 10) < preFilterConfig.dateFrom) return false;
        if (preFilterConfig.dateTo.trim() && r.createdAt.slice(0, 10) > preFilterConfig.dateTo) return false;
        return true;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || (r.email && r.email.toLowerCase().includes(q)));
    }
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [resumes, searchQuery, statusFilter, preFilterConfig]);

  const sortedResumes = useMemo(() => {
    return [...filteredResumes].sort((a, b) => {
      const scoreA = a.score ?? screeningResults.get(a.id)?.score ?? -1;
      const scoreB = b.score ?? screeningResults.get(b.id)?.score ?? -1;
      return scoreB - scoreA;
    });
  }, [filteredResumes, screeningResults]);

  const stats = useMemo(() => ({
    all: resumes.length,
    pending: resumes.filter((r) => r.status === "pending").length,
    passed: resumes.filter((r) => r.status === "passed").length,
    rejected: resumes.filter((r) => r.status === "rejected").length,
  }), [resumes]);

  const listTotalPages = Math.max(1, Math.ceil(sortedResumes.length / LIST_PAGE_SIZE));
  const paginatedResumes = useMemo(
    () => sortedResumes.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE),
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

  useEffect(() => { setListPage(1); }, [searchQuery, statusFilter, preFilterConfig]);
  useEffect(() => {
    setReasoningOpen(Boolean(selectedResult?.reasoning?.trim()));
  }, [selectedResumeId, selectedResult?.reasoning]);

  useEffect(() => {
    const activeId = localStorage.getItem("active-screening-template");
    if (activeId) {
      localStorage.removeItem("active-screening-template");
      getTemplate(Number(activeId))
        .then((tpl) => { setPreFilterConfig(tpl.config); return tpl; })
        .then((tpl) => {
          if (!isEmptyPreFilter(tpl.config)) loadResumes(tpl.config);
          else loadResumes();
          toast.success(`已应用模版「${tpl.name}」的筛选条件`);
        })
        .catch(() => loadResumes());
    } else {
      loadTemplates()
        .then((list) => {
          const def = list.find((t) => t.isDefault);
          if (def) {
            setPreFilterConfig(def.config);
            if (!isEmptyPreFilter(def.config)) return loadResumes(def.config);
          }
          return loadResumes();
        })
        .catch(() => loadResumes());
    }
    loadAiConfigs();
  }, []);

  const loadAiConfigs = async () => {
    try {
      setLoadingAiConfigs(true);
      const configs = await getAiConfigs();
      setAiConfigs(configs);
      if (configs.length > 0) {
        const defaultConfig = configs.find((c) => c.isDefault) || configs[0];
        setSelectedAiConfigId(defaultConfig.id);
        if (defaultConfig.prompt) setJobRequirements(defaultConfig.prompt);
      }
    } catch (error) {
      console.error("加载AI配置失败:", error);
    } finally {
      setLoadingAiConfigs(false);
    }
  };

  const loadResumes = async (filters?: Parameters<typeof getFilteredResumes>[0]) => {
    try {
      setLoading(true);
      const data = filters && !isEmptyPreFilter(filters as PreFilterConfig)
        ? await getFilteredResumes(filters)
        : await getResumes();
      setResumes(data);
    } catch (error) {
      console.error("加载简历失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResume = (resumeId: number) => setSelectedResumeId(resumeId);

  const getResumeFileUrl = (resume: Resume) => {
    if (!resume.resumeFile) return;
    const relativePath = resume.resumeFile
      .replace(/^.*[\/]uploads[\/]/, "uploads/")
      .replace(/\\/g, "/");
    return `${API_BASE_URL}/${relativePath}`;
  };

  const openResumeInNewWindow = (resume: Resume) => {
    const url = getResumeFileUrl(resume);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleUpdateStatus = async (resumeId: number, status: "pending" | "passed" | "rejected") => {
    const resume = resumes.find((r) => r.id === resumeId);
    try {
      await updateResumeStatus(resumeId, status);
      setResumes((prev) => prev.map((r) => (r.id === resumeId ? { ...r, status } : r)));
      if (status === "passed") {
        await logActivity({ type: "pass", resumeId, resumeName: resume?.name ?? undefined, description: "通过初筛" });
      } else if (status === "rejected") {
        await logActivity({ type: "reject", resumeId, resumeName: resume?.name ?? undefined, description: "未通过筛选" });
      }
    } catch (error) {
      console.error("更新状态失败:", error);
    }
  };

  const handleScreenResume = async (resumeId: number) => {
    if (!jobRequirements.trim()) { toast.error("请输入岗位要求"); return; }
    if (!selectedAiConfigId) { toast.error("请选择 AI 配置"); return; }
    try {
      setScreeningResumeId(resumeId);
      const result = await screenResumeWithAi({ resumeId, jobRequirements, aiConfigId: selectedAiConfigId });
      const resume = resumes.find((r) => r.id === resumeId);
      if (resume) {
        setResumes((prev) => prev.map((r) =>
          r.id === resumeId
            ? { ...r, summary: result.reasoning, status: mapRecommendationToStatus(result.recommendation), score: result.score }
            : r,
        ));
      }
      setScreeningResults((prev) => {
        const newMap = new Map(prev);
        newMap.set(resumeId, { ...result, resumeId, resume });
        return newMap;
      });
      await logActivity({ type: "screening", resumeId, resumeName: resume?.name ?? undefined, description: result.reasoning ?? undefined });
      await loadResumes();
      try {
        await updateAiConfig(selectedAiConfigId!, { prompt: jobRequirements });
        setAiConfigs((prev) => prev.map((c) => c.id === selectedAiConfigId ? { ...c, prompt: jobRequirements } : c));
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

  const handleBatchScreen = async () => {
    if (!jobRequirements.trim()) { toast.error("请输入岗位要求"); return; }
    if (!selectedAiConfigId) { toast.error("请选择 AI 配置"); return; }
    const toScreen = sortedResumes;
    if (toScreen.length === 0) { toast.error("当前筛选结果为空，无可筛简历"); return; }
    try {
      setScreeningAll(true);
      const results = await batchScreenResumesWithAi({
        resumeIds: toScreen.map((r) => r.id),
        jobRequirements,
        aiConfigId: selectedAiConfigId,
      });
      setResumes((prev) => prev.map((r) => {
        const item = results.find((res) => res.resumeId === r.id && res.success && res.result);
        if (!item || !item.result) return r;
        return { ...r, summary: item.result.reasoning, status: mapRecommendationToStatus(item.result.recommendation), score: item.result.score };
      }));
      setScreeningResults((prev) => {
        const newMap = new Map(prev);
        results.forEach((item) => {
          if (item.success && item.result) {
            const resume = toScreen.find((r) => r.id === item.resumeId);
            newMap.set(item.resumeId, { ...item.result, resumeId: item.resumeId, resume });
          }
        });
        return newMap;
      });
      await Promise.all(
        results.filter((item) => item.success && item.result).map((item) => {
          const r = toScreen.find((res) => res.id === item.resumeId);
          return logActivity({ type: "screening", resumeId: item.resumeId, resumeName: r?.name ?? undefined, description: item.result!.reasoning ?? undefined });
        }),
      );
      await loadResumes();
      try {
        await updateAiConfig(selectedAiConfigId!, { prompt: jobRequirements });
        setAiConfigs((prev) => prev.map((c) => c.id === selectedAiConfigId ? { ...c, prompt: jobRequirements } : c));
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
        onApply={(config) => {
          void loadResumes(isEmptyPreFilter(config) ? undefined : config);
          setPreFilterModalOpen(false);
        }}
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
        batchDisabled={screeningAll || sortedResumes.length === 0 || !selectedAiConfigId || !jobRequirements.trim()}
      />

      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[#f0f6ff]"
        aria-hidden
      />

      <div className="mx-auto flex min-h-0 max-w-[1400px] flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:mb-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-600 ring-1 ring-inset ring-blue-200">
                <Sparkles className="h-3 w-3" />
                AI Screening
              </span>
            </div>
            <h1 className="mt-2.5 text-[1.6rem] font-black tracking-tight text-blue-950 sm:text-[1.85rem]">
              智能筛选工作台
            </h1>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-blue-900/60">
              从左侧选择候选人，右侧查看 AI 评分与推荐理由，一键决策通过或拒绝。
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                共 {stats.all} 份
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-500 shadow-sm backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
                待筛选 {stats.pending}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                已通过 {stats.passed}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-400 shadow-sm backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                已拒绝 {stats.rejected}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJobConfigModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/70 bg-white/35 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-[0_10px_30px_rgba(37,99,235,0.14)] backdrop-blur-xl transition-all hover:bg-white/50 hover:border-blue-200/70 hover:shadow-[0_12px_34px_rgba(37,99,235,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 lg:self-auto"
          >
            <Settings2 className="h-4 w-4" aria-hidden />
            岗位与 AI 配置
          </button>
        </header>
        <section
          className="flex min-h-[min(640px,calc(100vh-10rem))] flex-1 flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white/80 shadow-[0_2px_24px_rgba(59,130,246,0.08)] backdrop-blur-md"
          aria-label="AI 筛选工作台"
        >
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
            <aside className="flex min-h-[min(400px,48vh)] flex-col border-b border-blue-100 bg-blue-50/40 min-w-0 lg:col-span-4 lg:min-h-0 lg:border-b-0 lg:border-r lg:border-blue-100">
              <div className="shrink-0 border-b border-slate-200 px-4 pb-3 pt-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-800">候选人列表</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreFilterModalOpen(true)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 ${
                        isEmptyPreFilter(preFilterConfig)
                          ? "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          : "bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                      }`}
                    >
                      <Filter className="h-3.5 w-3.5" aria-hidden />
                      筛选条件
                      {!isEmptyPreFilter(preFilterConfig) && (
                        <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden />
                      )}
                    </button>
                    <span className="tabular-nums text-[11px] text-slate-400">
                      {filteredResumes.length} 条
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                  <input
                    type="search"
                    placeholder="搜索姓名或邮箱…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full rounded-lg border border-blue-100 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    aria-label="搜索候选人"
                  />
                </div>
              </div>

              <div className="shrink-0 border-b border-slate-200 px-3 py-2" role="group" aria-label="按状态筛选">
                <div className="flex gap-1 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
                  {([
                    { key: "all" as const, label: "全部", color: "" },
                    { key: "pending" as const, label: "待筛选", color: STATUS_META.pending.dot },
                    { key: "passed" as const, label: "已通过", color: STATUS_META.passed.dot },
                    { key: "rejected" as const, label: "已拒绝", color: STATUS_META.rejected.dot },
                  ] as const).map(({ key, label, color }) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={statusFilter === key ? "true" : "false"}
                      onClick={() => setStatusFilter(key)}
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        statusFilter === key
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {color && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />}
                      {label}
                      <span className="tabular-nums opacity-70">
                        {key === "all" ? stats.all : stats[key]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
                {loading ? (
                  <ul className="space-y-2 p-1" aria-busy="true" aria-label="加载中">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <li key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </ul>
                ) : filteredResumes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                      <FileText className="h-7 w-7 text-slate-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      {resumes.length === 0 ? "还没有简历" : "没有符合条件的候选人"}
                    </p>
                    <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-slate-500">
                      {resumes.length === 0 ? "上传后即可在此用 AI 初筛" : "调整搜索、状态或筛选条件试试"}
                    </p>
                    {resumes.length === 0 && (
                      <Link
                        to="/app/resumes"
                        className="mt-5 inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                      >
                        前往简历管理
                      </Link>
                    )}
                  </div>
                ) : (
                  <ul role="listbox" aria-label="候选人列表" className="flex flex-col gap-1 p-1">
                    {paginatedResumes.map((resume) => {
                      const scoreVal = resume.score ?? screeningResults.get(resume.id)?.score ?? null;
                      const selected = selectedResumeId === resume.id;
                      const meta = STATUS_META[resume.status];
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
                          className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 ${
                            selected
                              ? "border-blue-200 bg-white shadow-md shadow-blue-900/5 ring-1 ring-blue-100"
                              : "border-transparent bg-white/60 hover:border-blue-100 hover:bg-white hover:shadow-sm"
                          }`}
                        >
                          {selected && (
                            <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-blue-500" />
                          )}
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                              selected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 group-hover:bg-blue-100"
                            }`}
                            aria-hidden
                          >
                            {getInitials(resume.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-blue-950">{resume.name}</p>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                {meta.label}
                              </span>
                              {resume.phone && (
                                <span className="truncate text-[11px] text-slate-400">{resume.phone.slice(0, 3)}···</span>
                              )}
                            </div>
                          </div>
                          {scoreVal != null && (
                            <span
                              className={`shrink-0 rounded-lg px-2 py-1 text-xs font-black tabular-nums ${
                                scoreVal >= 80 ? "bg-blue-600 text-white"
                                  : scoreVal >= 60 ? "bg-blue-100 text-blue-700"
                                  : "bg-blue-50 text-blue-400"
                              }`}
                            >
                              {scoreVal}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {!loading && filteredResumes.length > 0 && (
                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2.5">
                  <span className="text-[11px] tabular-nums text-slate-400">
                    {listTotalPages > 1 ? `第 ${listPage} / ${listTotalPages} 页 · ${filteredResumes.length} 条` : `${filteredResumes.length} 条`}
                  </span>
                  {listTotalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setListPage((p) => Math.max(1, p - 1))}
                        disabled={listPage <= 1}
                        className="rounded-lg border border-blue-200 bg-white p-1.5 text-blue-400 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-30"
                        aria-label="上一页"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
                        disabled={listPage >= listTotalPages}
                        className="rounded-lg border border-blue-200 bg-white p-1.5 text-blue-400 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-30"
                        aria-label="下一页"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </aside>
            <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white lg:col-span-8">
              {!selectedResume ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 ring-1 ring-blue-100 shadow-lg shadow-blue-100">
                    <Sparkles className="h-9 w-9 text-blue-500" strokeWidth={1.5} />
                  </div>
                  <p className="text-base font-bold text-blue-950">从左侧选择候选人</p>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-blue-400">
                    选中简历后可查看联系方式、AI 匹配评分与评估理由，并做出筛选决策。
                  </p>
                  <button
                    type="button"
                    onClick={() => setJobConfigModalOpen(true)}
                    className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/70 bg-white/35 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-[0_8px_28px_rgba(37,99,235,0.12)] backdrop-blur-xl transition-all hover:bg-white/50 hover:border-blue-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <Settings2 className="h-4 w-4" />
                    先配置岗位与 AI
                  </button>
                </div>
              ) : (
                <>
                  <div className="sticky top-0 z-10 shrink-0 border-b border-blue-100 bg-white/80 px-4 py-4 shadow-sm shadow-blue-900/[0.04] backdrop-blur-md sm:px-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl">
                            {selectedResume.name}
                          </h2>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${listStatusStyles[selectedResume.status]}`}>
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
                            onClick={() => openResumeInNewWindow(selectedResume)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/35 px-3 py-2 text-sm font-medium text-blue-700 shadow-[0_8px_24px_rgba(37,99,235,0.1)] backdrop-blur-xl transition-all hover:bg-white/50 hover:border-blue-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                          >
                            <ExternalLink className="h-4 w-4 text-blue-400" />
                            打开简历
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setJobConfigModalOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/35 px-3 py-2 text-sm font-medium text-blue-700 shadow-[0_8px_24px_rgba(37,99,235,0.1)] backdrop-blur-xl transition-all hover:bg-white/50 hover:border-blue-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        >
                          <Settings2 className="h-4 w-4 text-blue-400" />
                          AI 与岗位
                        </button>
                        {selectedResumeId != null && (
                          <button
                            type="button"
                            onClick={() => handleScreenResume(selectedResumeId)}
                            disabled={screeningResumeId === selectedResumeId || !jobRequirements.trim()}
                            title={!jobRequirements.trim() ? "请先在「岗位与 AI 配置」中填写岗位要求" : undefined}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45"
                          >
                            {screeningResumeId === selectedResumeId ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
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
                        <div className="rounded-2xl border border-blue-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
                          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-950">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
                              <User className="h-4 w-4 text-blue-500" />
                            </span>
                            基本信息
                          </h3>
                          <dl className="space-y-3 text-sm">
                            <div>
                              <dt className="text-xs font-medium text-blue-400">邮箱</dt>
                              <dd className="mt-0.5 break-all text-blue-900">{selectedResume.email || "—"}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-blue-400">电话</dt>
                              <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-blue-900">
                                {selectedResume.phone
                                  ? phoneExpanded
                                    ? selectedResume.phone
                                    : selectedResume.phone.length > 7
                                      ? `${selectedResume.phone.slice(0, 3)}****${selectedResume.phone.slice(-4)}`
                                      : "***"
                                  : "—"}
                                {selectedResume.phone && selectedResume.phone.length > 7 && (
                                  <button
                                    type="button"
                                    onClick={() => setPhoneExpanded((v) => !v)}
                                    className="text-xs font-semibold text-blue-500 hover:text-blue-700 focus-visible:outline-none focus-visible:underline"
                                  >
                                    {phoneExpanded ? "收起" : "显示全文"}
                                  </button>
                                )}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 shadow-sm backdrop-blur-sm">
                          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-950">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white ring-1 ring-blue-100">
                              <BarChart3 className="h-4 w-4 text-blue-500" />
                            </span>
                            匹配度
                          </h3>
                          {selectedResult ? (
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
                              <MatchScoreRing score={selectedResult.score} />
                              <div className="min-w-0 flex-1 text-center sm:text-left">
                                <p className="text-xs font-medium uppercase tracking-wide text-blue-400">维度参考（示意）</p>
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="w-10 shrink-0 font-semibold text-blue-900">技能</span>
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blue-100">
                                      <div
                                        className="h-full rounded-full bg-blue-500 transition-all duration-700"
                                        style={{ width: `${Math.min(selectedResult.score + 5, 100)}%` }}
                                      />
                                    </div>
                                    <span className="w-8 text-right text-xs tabular-nums text-blue-400">{Math.min(selectedResult.score + 5, 100)}%</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="w-10 shrink-0 font-semibold text-blue-900">学历</span>
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blue-100">
                                      <div
                                        className="h-full rounded-full bg-blue-300 transition-all duration-700"
                                        style={{ width: `${Math.max(selectedResult.score - 25, 0)}%` }}
                                      />
                                    </div>
                                    <span className="w-8 text-right text-xs tabular-nums text-blue-400">{Math.max(selectedResult.score - 25, 0)}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-6 text-center">
                              <p className="text-sm text-blue-400">尚未生成匹配分</p>
                              <p className="mt-1 text-xs text-blue-300">点击右上角「AI 筛选」运行模型</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white/80 shadow-sm backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={() => setReasoningOpen((v) => !v)}
                          aria-expanded={reasoningOpen ? "true" : "false"}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-blue-950">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100">
                              <MessageSquare className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                            </span>
                            AI 评估理由
                          </span>
                          {reasoningOpen ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-blue-300" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-blue-300" />
                          )}
                        </button>
                        {reasoningOpen && (
                          <div className="border-t border-blue-100 bg-blue-50/30 px-4 py-4">
                            <AiReasoningContent text={(selectedResult?.reasoning ?? "").trim()} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-blue-100 bg-white/80 px-4 py-3 shadow-[0_-4px_16px_rgba(59,130,246,0.06)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedResume.id, "pending")}
                      className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition-all hover:bg-blue-50 hover:border-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                    >
                      待定
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedResume.id, "rejected")}
                      className="rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-400 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
                      拒绝
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedResume.id, "passed")}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
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
