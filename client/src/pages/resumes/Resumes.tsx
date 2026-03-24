import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Upload,
  Mail,
  Search,
  Filter,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  ArrowUpDown,
} from "lucide-react";
import {
  getResumes,
  uploadResume,
  deleteResume,
  getResume,
  importResumesFromEmail,
} from "../../api/resume";
import { getEmailConfigs } from "../../api/email";
import { logActivity } from "../../api/dashboard";
import type { Resume } from "../../types/resume";
import type { EmailConfig } from "../../types/email";
import {
  ResumeList,
  ResumeModal,
  ResumeDetailDrawer,
  PdfPreviewModal,
} from "../../components/resumes";

type ResumeStatus = "all" | "pending" | "passed" | "rejected";

interface StatusTab {
  key: ResumeStatus;
  label: string;
  icon: typeof Clock;
  color: string;
  bgGradient: string;
  activeBg: string;
}

const STATUS_TABS: StatusTab[] = [
  {
    key: "all",
    label: "全部",
    icon: Inbox,
    color: "text-zinc-600",
    bgGradient: "from-zinc-500 to-slate-500",
    activeBg: "bg-zinc-900",
  },
  {
    key: "pending",
    label: "待筛选",
    icon: Clock,
    color: "text-amber-600",
    bgGradient: "from-amber-500 to-orange-500",
    activeBg: "bg-amber-500",
  },
  {
    key: "passed",
    label: "已通过",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgGradient: "from-emerald-500 to-teal-500",
    activeBg: "bg-emerald-500",
  },
  {
    key: "rejected",
    label: "已拒绝",
    icon: XCircle,
    color: "text-rose-600",
    bgGradient: "from-rose-500 to-pink-500",
    activeBg: "bg-rose-500",
  },
];

export default function Resumes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewResume, setViewResume] = useState<Resume | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{
    url: string;
    fileName: string;
  } | null>(null);

  // URL 参数自动打开上传弹窗
  useEffect(() => {
    if (searchParams.get("action") === "upload") {
      setShowModal(true);
      searchParams.delete("action");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // 筛选和搜索状态
  const [statusFilter, setStatusFilter] = useState<ResumeStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // 从邮箱导入相关状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  // 加载简历列表
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

  // 筛选后的简历
  const filteredResumes = useMemo(() => {
    const result = resumes.filter((resume) => {
      if (statusFilter !== "all" && resume.status !== statusFilter) {
        return false;
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          resume.name.toLowerCase().includes(query) ||
          resume.email?.toLowerCase().includes(query) ||
          resume.phone?.includes(query) ||
          resume.summary?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // 排序
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [resumes, statusFilter, searchQuery, sortOrder]);

  // 统计各状态数量
  const stats = useMemo(() => {
    return {
      all: resumes.length,
      pending: resumes.filter((r) => r.status === "pending").length,
      passed: resumes.filter((r) => r.status === "passed").length,
      rejected: resumes.filter((r) => r.status === "rejected").length,
    };
  }, [resumes]);

  // 加载邮箱配置列表
  const loadEmailConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const data = await getEmailConfigs();
      setEmailConfigs(data);
      if (data.length > 0) {
        setSelectedConfigId(data[0].id);
      }
    } catch (error) {
      console.error("加载邮箱配置失败:", error);
      toast.error("加载邮箱配置失败");
    } finally {
      setLoadingConfigs(false);
    }
  };

  // 打开导入弹窗
  const handleOpenImportModal = async () => {
    setShowImportModal(true);
    await loadEmailConfigs();
  };

  // 从邮箱导入简历
  const handleImportFromEmail = async () => {
    if (!selectedConfigId) {
      toast.error("请选择邮箱配置");
      return;
    }

    setImporting(true);
    try {
      const result = await importResumesFromEmail({
        configId: selectedConfigId,
      });
      await logActivity({
        type: "upload",
        description: `从邮箱导入 ${result.imported} 份简历`,
      });
      toast.success(`成功导入 ${result.imported} 份简历`);
      setShowImportModal(false);
      setSelectedConfigId(null);
      void loadResumes();
    } catch (error) {
      console.error("从邮箱导入失败:", error);
      toast.error("从邮箱导入失败");
    } finally {
      setImporting(false);
    }
  };

  // 处理文件选择
  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("只支持 PDF、Word 文档");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超过 10MB");
      return;
    }
    setSelectedFile(file);
  };

  // 上传简历
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("请选择文件");
      return;
    }

    setUploading(true);
    try {
      const data = await uploadResume({
        file: selectedFile,
        name: selectedFile.name.replace(/\.(pdf|docx|doc)$/i, ""),
      });
      await logActivity({
        type: "upload",
        resumeId: data.id,
        resumeName: data.name,
      });
      toast.success("上传成功");
      setShowModal(false);
      setSelectedFile(null);
      void loadResumes();
    } catch (error) {
      console.error("上传失败:", error);
      toast.error("上传失败");
    } finally {
      setUploading(false);
    }
  };

  // 删除简历
  const handleDelete = async (id: number, name: string) => {
    if (!confirm("确定要删除这份简历吗？")) return;

    try {
      await deleteResume(id);
      await logActivity({
        type: "reject",
        resumeId: id,
        resumeName: name,
        description: "删除了简历",
      });
      toast.success("删除成功");
      void loadResumes();
    } catch (error) {
      console.error("删除失败:", error);
      toast.error("删除失败");
    }
  };

  // 查看简历详情
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

  const activeTab = STATUS_TABS.find((t) => t.key === statusFilter) || STATUS_TABS[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-slate-50 to-blue-50/30 -m-6 p-6">
      {/* 页面头部 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              简历管理
            </h1>
            <p className="text-sm text-zinc-500">
              智能筛选与管理候选人简历
            </p>
          </div>
        </div>
      </div>

      {/* 统计卡片 - 现代化设计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATUS_TABS.map((tab, index) => {
          const Icon = tab.icon;
          const count = stats[tab.key];
          const isActive = statusFilter === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`
                relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-lg
                ${
                  isActive
                    ? `border-transparent bg-gradient-to-br ${tab.bgGradient} text-white shadow-xl`
                    : "border-zinc-200/80 bg-white/80 backdrop-blur-sm hover:border-zinc-300"
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* 背景装饰 */}
              <div
                className={`
                  absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10
                  ${isActive ? "bg-white" : `bg-gradient-to-br ${tab.bgGradient}`}
                `}
              />

              <div className="relative">
                <div
                  className={`
                    mb-3 flex h-10 w-10 items-center justify-center rounded-xl
                    ${
                      isActive
                        ? "bg-white/20 text-white"
                        : `bg-gradient-to-br ${tab.bgGradient} text-white shadow-md`
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <p
                  className={`
                    text-3xl font-bold tracking-tight mb-1
                    ${isActive ? "text-white" : "text-zinc-900"}
                  `}
                >
                  {count}
                </p>
                <p
                  className={`
                    text-sm font-medium
                    ${isActive ? "text-white/80" : tab.color}
                  `}
                >
                  {tab.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 筛选和搜索栏 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-zinc-200/80 p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              type="text"
              placeholder="搜索姓名、邮箱或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-zinc-50/80 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          {/* 排序切换 */}
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))
            }
            className="flex items-center justify-center gap-2 h-11 px-4 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-all"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "newest" ? "最新优先" : "最早优先"}
          </button>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleOpenImportModal}
              className="flex items-center gap-2 h-11 px-5 bg-white border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
            >
              <Mail className="h-4 w-4" />
              邮箱导入
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 h-11 px-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 hover:brightness-105 transition-all"
            >
              <Upload className="h-4 w-4" />
              上传简历
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        {/* 列表头部 */}
        <div className="px-5 py-4 border-b border-zinc-100/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-600">
              共 {filteredResumes.length} 份简历
              {statusFilter !== "all" && (
                <span className="text-zinc-400 ml-1.5">
                  · 筛选自 {resumes.length} 份
                </span>
              )}
            </span>
          </div>
          {activeTab.key !== "all" && (
            <div
              className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                ${activeTab.key === "pending" ? "bg-amber-50 text-amber-600" : ""}
                ${activeTab.key === "passed" ? "bg-emerald-50 text-emerald-600" : ""}
                ${activeTab.key === "rejected" ? "bg-rose-50 text-rose-600" : ""}
              `}
            >
              <activeTab.icon className="h-3.5 w-3.5" />
              {activeTab.label}
            </div>
          )}
        </div>

        <ResumeList
          resumes={filteredResumes}
          loading={loading}
          onView={handleView}
          onDelete={handleDelete}
        />
      </div>

      {/* 上传弹窗 */}
      <ResumeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedFile(null);
        }}
        type="upload"
        selectedFile={selectedFile}
        onFileChange={handleFileChange}
        onUpload={handleUpload}
        uploading={uploading}
      />

      {/* 查看简历详情抽屉 */}
      <ResumeDetailDrawer
        resume={viewResume}
        loading={viewLoading}
        onOpenChange={(open) => !open && setViewResume(null)}
        onPreview={(url, fileName) => setPdfPreview({ url, fileName })}
      />

      {/* PDF 预览模态框 */}
      <PdfPreviewModal
        isOpen={!!pdfPreview}
        onClose={() => setPdfPreview(null)}
        url={pdfPreview?.url || null}
        fileName={pdfPreview?.fileName || null}
      />

      {/* 从邮箱导入弹窗 */}
      <ResumeModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedConfigId(null);
        }}
        type="import"
        emailConfigs={emailConfigs}
        loadingConfigs={loadingConfigs}
        selectedConfigId={selectedConfigId}
        onConfigChange={setSelectedConfigId}
        onImport={handleImportFromEmail}
        importing={importing}
      />
    </div>
  );
}
