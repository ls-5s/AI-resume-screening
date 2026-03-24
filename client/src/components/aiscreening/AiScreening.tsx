import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Briefcase,
  User,
  MessageSquare,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  pending:
    "bg-amber-50 text-amber-800 border border-amber-200/80",
  passed:
    "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
  rejected: "bg-rose-50 text-rose-800 border border-rose-200/80",
};

const listStatusLabels = {
  pending: "待筛选",
  passed: "已通过",
  rejected: "已拒绝",
};

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
    return resumes.filter((r) => {
      const matchSearch =
        !searchQuery.trim() ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.email && r.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [resumes, searchQuery, statusFilter]);

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

  useEffect(() => {
    setListPage(1);
  }, [searchQuery, statusFilter]);

  // 加载简历列表和AI配置
  useEffect(() => {
    loadResumes();
    loadAiConfigs();
  }, []);

  useEffect(() => {
    if (!jobConfigModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setJobConfigModalOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [jobConfigModalOpen]);

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

    if (resumes.length === 0) {
      toast.error("暂无简历可筛选");
      return;
    }

    try {
      setScreeningAll(true);
      const results = await batchScreenResumesWithAi({
        resumeIds: resumes.map((r) => r.id),
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
            const resume = resumes.find((r) => r.id === item.resumeId);
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
            const r = resumes.find((res) => res.id === item.resumeId);
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

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);
  let selectedResult: ScreeningResult | null = null;
  if (selectedResumeId && selectedResume) {
    selectedResult =
      screeningResults.get(selectedResumeId) ||
      (selectedResume.summary
        ? {
            resumeId: selectedResume.id,
            recommendation: mapStatusToRecommendation(selectedResume.status),
            score: selectedResume.score ?? 50,
            reasoning: selectedResume.summary,
            resume: selectedResume,
          }
        : null);
  }

  return (
    <div className="relative flex min-h-full flex-col">
      {jobConfigModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="岗位要求与 AI 配置"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setJobConfigModalOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]" />

          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between border-b border-zinc-100/80 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
                  <Briefcase className="h-4 w-4" />
                </div>
                <p className="truncate text-sm font-semibold text-zinc-900">
                  岗位要求与 AI 配置
                </p>
              </div>
              <button
                type="button"
                onClick={() => setJobConfigModalOpen(false)}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
                title="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_16rem] md:items-start">
                <div className="min-w-0">
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    岗位要求
                  </label>
                  <textarea
                    value={jobRequirements}
                    onChange={(e) => setJobRequirements(e.target.value)}
                    placeholder="请输入岗位要求，例如：需要3年以上前端开发经验，熟悉 React、Vue 框架..."
                    className="w-full resize-none rounded-xl border border-zinc-200/80 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    rows={6}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="min-w-0">
                    <label className="mb-2 block text-sm font-medium text-zinc-700">
                      AI 配置
                    </label>
                    {loadingAiConfigs ? (
                      <div className="flex h-10 items-center justify-center rounded-xl bg-zinc-50">
                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                      </div>
                    ) : aiConfigs.length === 0 ? (
                      <div className="flex h-10 items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-500">
                        暂无 AI 配置
                      </div>
                    ) : (
                      <select
                        title="选择 AI 配置"
                        value={selectedAiConfigId ?? ""}
                        onChange={(e) => {
                          const configId = Number(e.target.value);
                          setSelectedAiConfigId(configId);
                          const selectedConfig = aiConfigs.find(
                            (c) => c.id === configId,
                          );
                          if (selectedConfig?.prompt) {
                            setJobRequirements(selectedConfig.prompt);
                          }
                        }}
                        className="w-full rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      >
                        {aiConfigs
                          .filter((config) => config.id !== null)
                          .map((config) => (
                            <option key={config.id} value={config.id!}>
                              {config.name} ({config.model})
                            </option>
                          ))}
                      </select>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleBatchScreen}
                    disabled={
                      screeningAll ||
                      resumes.length === 0 ||
                      !selectedAiConfigId ||
                      !jobRequirements.trim()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {screeningAll ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    批量筛选全部
                  </button>

                  <button
                    type="button"
                    onClick={() => setJobConfigModalOpen(false)}
                    className="w-full rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]"
        aria-hidden
      />

      <div className="mx-auto flex min-h-0 max-w-[1360px] flex-1 flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-1 sm:mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            AI Screening
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
            AI 智能筛选
          </h1>
          <p className="text-sm text-zinc-500">
            选择候选人、配置岗位要求与模型，查看匹配度与评估理由
          </p>
        </header>

        <section
          className="flex min-h-[min(640px,calc(100vh-11rem))] flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)]"
          aria-label="AI 筛选工作台"
        >
          <div className="flex min-h-0 flex-1">
            <aside className="flex w-[380px] shrink-0 flex-col border-r border-zinc-200/80 bg-zinc-50/50">
              <div className="shrink-0 border-b border-zinc-100/80 p-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="search"
                    placeholder="搜索姓名/邮箱"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200/80 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    aria-label="搜索简历"
                  />
                </div>
              </div>
              <div
                className="shrink-0 border-b border-zinc-100/80 px-2 py-2"
                role="group"
                aria-label="按状态筛选"
              >
                <div className="flex flex-wrap gap-1">
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
                      onClick={() => setStatusFilter(key)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                        statusFilter === key
                          ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      {label}（{key === "all" ? stats.all : stats[key]}）
                    </button>
                  ))}
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <Loader2
                      className="h-9 w-9 animate-spin text-zinc-300"
                      strokeWidth={1.75}
                    />
                  </div>
                ) : filteredResumes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                    <FileText
                      className="mb-3 h-12 w-12 text-zinc-200"
                      strokeWidth={1.25}
                    />
                    <p className="text-sm font-medium text-zinc-600">
                      暂无简历数据
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      请先在简历管理中上传
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {paginatedResumes.map((resume) => (
                      <div
                        key={resume.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectResume(resume.id)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSelectResume(resume.id)
                        }
                        className={`cursor-pointer border-l-4 p-3 transition-colors hover:bg-white/80 ${
                          selectedResumeId === resume.id
                            ? "border-sky-500 bg-sky-50/60"
                            : "border-transparent"
                        }`}
                      >
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-zinc-900">
                              {resume.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-zinc-500">
                              {resume.phone || "—"}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            {(resume.score != null ||
                              screeningResults.get(resume.id)) && (
                              <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-xs font-semibold text-sky-800">
                                {resume.score ??
                                  screeningResults.get(resume.id)?.score ??
                                  0}
                                %
                              </span>
                            )}
                            <span
                              className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${listStatusStyles[resume.status]}`}
                            >
                              {listStatusLabels[resume.status]}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!loading && filteredResumes.length > 0 && (
                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-zinc-200/80 bg-white px-3 py-2.5">
                  <span className="text-xs text-zinc-500">
                    {listTotalPages > 1
                      ? `第 ${listPage}/${listTotalPages} 页 · 共 ${filteredResumes.length} 条`
                      : `共 ${filteredResumes.length} 条`}
                  </span>
                  {listTotalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setListPage((p) => Math.max(1, p - 1))}
                        disabled={listPage <= 1}
                        className="rounded-lg border border-zinc-200/80 bg-white p-1.5 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="上一页"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setListPage((p) => Math.min(listTotalPages, p + 1))
                        }
                        disabled={listPage >= listTotalPages}
                        className="rounded-lg border border-zinc-200/80 bg-white p-1.5 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="下一页"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </aside>

            <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
              {!selectedResume ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-50 ring-1 ring-sky-100">
                    <Sparkles className="h-9 w-9 text-sky-500" />
                  </div>
                  <p className="font-medium text-zinc-700">请选择一份简历</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    在左侧列表中点击候选人，查看详情与 AI 结果
                  </p>
                </div>
              ) : (
                <>
                  <div className="shrink-0 border-b border-zinc-100/80 px-6 py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
                          {selectedResume.name}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                          导入于 {formatDateShort(selectedResume.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedResume.resumeFile && (
                          <button
                            type="button"
                            onClick={() =>
                              openResumeInNewWindow(selectedResume)
                            }
                            className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                          >
                            打开简历
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setJobConfigModalOpen(true)}
                          className="rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                        >
                          AI 设置
                        </button>
                        {selectedResumeId && (
                          <button
                            type="button"
                            onClick={() =>
                              handleScreenResume(selectedResumeId)
                            }
                            disabled={
                              screeningResumeId === selectedResumeId ||
                              !jobRequirements.trim()
                            }
                            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {screeningResumeId === selectedResumeId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            AI 筛选
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-6">
                    <div className="mx-auto max-w-3xl space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/30 p-4">
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                            <User className="h-4 w-4 text-zinc-400" />
                            基本信息
                          </h3>
                          <div className="space-y-2 text-sm text-zinc-700">
                            <p>邮箱：{selectedResume.email || "—"}</p>
                            <p className="flex flex-wrap items-center gap-1">
                              电话：
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
                                    className="text-sky-600 hover:underline"
                                  >
                                    {phoneExpanded ? "收起" : "展开"}
                                  </button>
                                )}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/30 p-4">
                          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                            <BarChart3 className="h-4 w-4 text-zinc-400" />
                            匹配度
                          </h3>
                          {selectedResult ? (
                            <div>
                              <p className="text-2xl font-semibold tabular-nums text-zinc-900">
                                {selectedResult.score}%
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                技能 {Math.min(selectedResult.score + 5, 100)}%
                                · 学历{" "}
                                {Math.max(selectedResult.score - 25, 0)}%
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-zinc-500">
                              暂无匹配度，请先进行 AI 筛选
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
                        <button
                          type="button"
                          onClick={() => setReasoningOpen((v) => !v)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-50/80"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                            <MessageSquare className="h-4 w-4 text-zinc-400" />
                            AI 评估理由
                          </span>
                          {reasoningOpen ? (
                            <ChevronUp className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-zinc-400" />
                          )}
                        </button>
                        {reasoningOpen && (
                          <div className="border-t border-zinc-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                            {selectedResult?.reasoning ||
                              "暂无评估理由，请先进行 AI 筛选。"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-zinc-100/80 bg-zinc-50/40 px-4 py-3 sm:gap-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedResume.id, "pending")
                      }
                      className="rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      待定
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedResume.id, "rejected")
                      }
                      className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700"
                    >
                      拒绝
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedResume.id, "passed")
                      }
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
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
