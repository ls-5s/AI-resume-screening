import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getResumes,
  deleteResume,
  getResume,
} from "../../api/resume";
import { logActivity } from "../../api/dashboard";
import type { Resume } from "../../types/resume";
import {
  ResumeList,
  ResumeDetailDrawer,
  PdfPreviewModal,
} from "../../components/resumes";
import { ConfirmModal } from "../../components/Modal";

const PAGE_SIZE = 10;

function SkeletonAllTable() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-3xl border border-zinc-200/70 bg-white">
      <div className="border-b border-zinc-100 px-6 py-4">
        <div className="h-4 w-28 rounded bg-zinc-100" />
        <div className="mt-2 h-3 w-40 rounded bg-zinc-100" />
      </div>
      <div className="flex flex-1 flex-col gap-px">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-zinc-100 bg-white px-6 py-4 last:border-b-0"
          >
            <div className="flex flex-1 items-center gap-3">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-zinc-100" />
              <div className="h-3 w-28 rounded bg-zinc-100" />
            </div>
            <div className="h-5 w-16 rounded-full bg-zinc-100" />
            <div className="h-3 w-40 rounded bg-zinc-100" />
            <div className="ml-auto flex gap-2">
              <div className="h-8 w-8 rounded-md bg-zinc-100" />
              <div className="h-8 w-8 rounded-md bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResumesAll() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewResume, setViewResume] = useState<Resume | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getResumes();
      setResumes(data);
    } catch (error) {
      console.error("加载简历失败:", error);
      toast.error("加载简历失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  const sortedResumes = useMemo(() => {
    return [...resumes].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [resumes]);

  const totalPages = Math.max(1, Math.ceil(sortedResumes.length / PAGE_SIZE));
  const paginatedResumes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedResumes.slice(start, start + PAGE_SIZE);
  }, [sortedResumes, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDelete = (id: number, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const { id, name } = deleteConfirm;
    setDeleteLoading(true);
    try {
      await deleteResume(id);
      await logActivity({
        type: "reject",
        resumeId: id,
        resumeName: name,
        description: "删除了简历",
      });
      toast.success("删除成功");
      setDeleteConfirm(null);
      void loadResumes();
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleView = async (id: number) => {
    setViewLoading(true);
    try {
      const data = await getResume(id);
      setViewResume(data);
    } catch (error) {
      console.error("获取简历详情失败:", error);
      toast.error("获取简历详情失败");
    } finally {
      setViewLoading(false);
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="relative min-h-full">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,165,233,0.08),transparent)]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1360px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              Resume Library
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[1.75rem]">
                全部简历
              </h1>
              <Link
                to="/app/resumes"
                className="text-sm font-semibold text-sky-600 no-underline transition-colors hover:text-sky-700"
              >
                ← 返回概览
              </Link>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              共 {resumes.length.toLocaleString()} 份，按导入时间从新到旧排列
            </p>
          </div>
          <time
            dateTime={now.toISOString()}
            className="text-sm tabular-nums text-zinc-500"
          >
            {dateStr}
          </time>
        </header>

        <section
          className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)]"
          aria-label="全部简历列表"
        >
          <div className="border-b border-zinc-100/80 px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
              全部列表
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              共 {sortedResumes.length} 份 · 每页 {PAGE_SIZE} 条
            </p>
          </div>

          {loading ? (
            <SkeletonAllTable />
          ) : (
            <>
              <ResumeList
                resumes={paginatedResumes}
                loading={loading}
                onView={handleView}
                onDelete={handleDelete}
              />
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100/80 px-6 py-4">
                  <p className="text-xs text-zinc-500">
                    第 {(currentPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(currentPage * PAGE_SIZE, sortedResumes.length)}{" "}
                    条，共 {sortedResumes.length} 份
                  </p>
                  <nav
                    className="flex items-center gap-1"
                    aria-label="分页"
                  >
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                      aria-label="上一页"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPages <= 7) return true;
                          if (p === 1 || p === totalPages) return true;
                          if (Math.abs(p - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((p, idx, arr) => (
                          <span key={p}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <span className="inline-flex w-8 justify-center text-zinc-300">
                                …
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`
                                flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors
                                ${
                                  p === currentPage
                                    ? "border-sky-200 bg-sky-50 text-sky-700"
                                    : "border-zinc-200/80 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
                                }
                              `}
                            >
                              {p}
                            </button>
                          </span>
                        ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 transition-colors hover:bg-zinc-50 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                      aria-label="下一页"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <ResumeDetailDrawer
        resume={viewResume}
        loading={viewLoading}
        onOpenChange={(open) => !open && setViewResume(null)}
        onPreview={(url, fileName) => setPdfPreview({ url, fileName })}
      />

      <PdfPreviewModal
        isOpen={!!pdfPreview}
        onClose={() => setPdfPreview(null)}
        url={pdfPreview?.url || null}
        fileName={pdfPreview?.fileName || null}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="确认删除"
        message={`确定要删除简历「${deleteConfirm?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        confirmVariant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
