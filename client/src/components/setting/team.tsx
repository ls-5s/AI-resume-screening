/**
 * 团队设置组件
 * 创建/编辑团队、成员管理、邀请审批
 */

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Trash2,
  Mail,
  Loader2,
  Shield,
  Crown,
  ChevronDown,
  LogOut,
  Copy,
  Link2,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
} from "lucide-react";
import toast from "../../utils/toast";
import { SettingSkeleton } from "./SettingSkeleton";
import type { TeamOrNull, TeamMember, MemberRole, InviteLink, PendingInvite } from "../../types/team";
import {
  getTeam,
  createTeam as createTeamApi,
  getTeamMembers,
  getCurrentUserRole,
  createInviteLink as createInviteLinkApi,
  removeMember,
  updateMemberRole,
  leaveTeam,
  getPendingInvites as getPendingInvitesApi,
  approveInvite,
  rejectInvite as rejectInviteApi,
} from "../../api/team";

// ============================================================================
// Constants
// ============================================================================

// 角色配置：owner/admin/member 的显示标签、图标、颜色
const ROLE_CONFIG: Record<
  MemberRole,
  { label: string; icon: React.ElementType; bg: string; text: string }
> = {
  owner: {
    label: "所有者",
    icon: Crown,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
  },
  admin: {
    label: "管理员",
    icon: Shield,
    bg: "bg-(--app-accent-soft)",
    text: "text-(--app-accent)",
  },
  member: {
    label: "成员",
    icon: Users,
    bg: "bg-(--app-surface-raised)",
    text: "text-(--app-text-secondary)",
  },
};

// ============================================================================
// useTeam Hook — 团队成员数据 + 邀请/移除/角色变更/离开操作
// ============================================================================

interface UseTeamReturn {
  members: TeamMember[];
  currentUserId: number | null;
  currentUserRole: MemberRole | null;
  isLoading: boolean;
  isInviting: boolean;
  inviteRole: "admin" | "member";
  setInviteRole: (v: "admin" | "member") => void;
  handleInvite: () => Promise<InviteLink | null | undefined>;
  handleRemove: (memberId: number) => Promise<void>;
  handleRoleChange: (memberId: number, role: "admin" | "member") => Promise<void>;
  handleLeave: () => Promise<void>;
  refetch: () => void;
}

function useTeam(): UseTeamReturn {
  // 团队成员列表
  const [members, setMembers] = useState<TeamMember[]>([]);
  // 当前用户在团队中的角色（owner/admin/member）
  const [currentUserRole, setCurrentUserRole] = useState<MemberRole | null>(null);
  // 当前用户的 userId，用于判断 "自己"
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // 邀请相关
  const [isInviting, setIsInviting] = useState(false);
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");

  // 获取成员列表和当前用户角色（并行请求）
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [memberList, roleData] = await Promise.all([
        getTeamMembers(),
        getCurrentUserRole(),
      ]);
      setMembers(memberList);
      setCurrentUserRole(roleData.role);
      setCurrentUserId(roleData.userId);
    } catch {
      toast.error("加载团队成员失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  // 生成邀请链接：调 API → 返回邀请链接对象（含 URL + token）
  const handleInvite = useCallback(async () => {
    setIsInviting(true);
    try {
      const invite = await createInviteLinkApi({ role: inviteRole });
      toast.success("邀请链接已生成");
      return invite;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "邀请失败";
      toast.error(msg);
      return null;
    } finally {
      setIsInviting(false);
    }
  }, [inviteRole]);

  // 移除成员：确认 → 调 API → 从本地列表移除（乐观更新）
  const handleRemove = useCallback(
    async (memberId: number) => {
      if (!confirm("确定要移除该成员吗？")) return;
      try {
        await removeMember(memberId);
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success("成员已移除");
      } catch {
        toast.error("移除成员失败");
      }
    },
    []
  );

  // 变更角色：调 API → 用返回结果更新本地列表
  const handleRoleChange = useCallback(
    async (memberId: number, role: "admin" | "member") => {
      try {
        const updated = await updateMemberRole(memberId, role);
        setMembers((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m))
        );
        toast.success("角色已更新");
      } catch {
        toast.error("更新角色失败");
      }
    },
    []
  );

  // 离开团队：确认 → 调 API → 刷新页面（清空团队上下文）
  const handleLeave = useCallback(async () => {
    if (!confirm("确定要离开团队吗？离开后将无法访问团队资源。")) return;
    try {
      await leaveTeam();
      toast.success("已离开团队");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "离开团队失败";
      toast.error(msg);
    }
  }, []);

  return {
    members,
    currentUserId,
    currentUserRole,
    isLoading,
    isInviting,
    inviteRole,
    setInviteRole,
    handleInvite,
    handleRemove,
    handleRoleChange,
    handleLeave,
    refetch: fetchMembers,
  };
}

// ============================================================================
// usePendingInvites Hook — 待审核加入申请的数据 + 审批/拒绝操作
// 注意：非管理员调用 getPendingInvites 会报错，catch 中静默设为空数组
// ============================================================================

interface UsePendingInvitesReturn {
  pendingInvites: PendingInvite[];
  isLoadingPending: boolean;
  isApproving: boolean;
  isRejecting: boolean;
  handleApprove: (inviteId: number) => Promise<void>;
  handleReject: (inviteId: number) => Promise<void>;
}

function usePendingInvites(onComplete: () => void): UsePendingInvitesReturn {
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchPending = useCallback(async () => {
    setIsLoadingPending(true);
    try {
      const data = await getPendingInvitesApi();
      setPendingInvites(data);
    } catch {
      // 非管理员用户无法获取申请列表，静默处理
      setPendingInvites([]);
    } finally {
      setIsLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    void fetchPending();
  }, [fetchPending]);

  const handleApprove = useCallback(async (inviteId: number) => {
    setIsApproving(true);
    try {
      await approveInvite(inviteId);
      setPendingInvites((prev) => prev.filter((p) => p.id !== inviteId));
      toast.success("已批准加入申请");
      onComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "批准失败";
      toast.error(msg);
    } finally {
      setIsApproving(false);
    }
  }, [onComplete]);

  const handleReject = useCallback(async (inviteId: number) => {
    if (!confirm("确定要拒绝该申请吗？")) return;
    setIsRejecting(true);
    try {
      await rejectInviteApi(inviteId);
      setPendingInvites((prev) => prev.filter((p) => p.id !== inviteId));
      toast.success("已拒绝加入申请");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "拒绝失败";
      toast.error(msg);
    } finally {
      setIsRejecting(false);
    }
  }, []);

  return {
    pendingInvites,
    isLoadingPending,
    isApproving,
    isRejecting,
    handleApprove,
    handleReject,
  };
}

// ============================================================================
// CreateTeamForm — 无团队时显示的创建团队表单
// 包含团队名称（必填）+ 描述（可选），提交后刷新页面
// ============================================================================

function CreateTeamForm({ onCreated }: { onCreated: () => void }) {
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!teamName.trim()) {
      toast.error("请输入团队名称");
      return;
    }
    setCreating(true);
    try {
      await createTeamApi({ name: teamName.trim(), description: description.trim() || undefined });
      toast.success("团队创建成功");
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "创建团队失败";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="rounded-2xl border border-(--app-border) bg-(--app-surface) p-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-(--app-primary) to-(--app-accent)">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-(--app-text-primary)">创建你的团队</h2>
        <p className="mb-6 text-sm text-(--app-text-secondary)">
          创建一个团队后，你可以邀请同事加入，共享简历和 AI 配置
        </p>

        <div className="mb-4 text-left">
          <label className="mb-1.5 block text-sm font-medium text-(--app-text-primary)">
            团队名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="例如：XX 科技招聘团队"
            className="w-full rounded-xl border border-(--app-border) bg-(--app-bg) px-4 py-2.5 text-sm text-(--app-text-primary) placeholder:text-(--app-text-muted) focus:border-(--app-primary) focus:outline-none focus:ring-2 focus:ring-(--app-ring)"
          />
        </div>

        <div className="mb-6 text-left">
          <label className="mb-1.5 block text-sm font-medium text-(--app-text-primary)">
            团队描述（可选）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简单介绍一下你的团队..."
            rows={3}
            className="w-full rounded-xl border border-(--app-border) bg-(--app-bg) px-4 py-2.5 text-sm text-(--app-text-primary) placeholder:text-(--app-text-muted) focus:border-(--app-primary) focus:outline-none focus:ring-2 focus:ring-(--app-ring)"
          />
        </div>

        <button
          onClick={() => void handleCreate()}
          disabled={creating || !teamName.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-(--app-primary) to-(--app-accent) px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              创建中...
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              创建团队
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MemberAvatar
// ============================================================================

function MemberAvatar({ src, name }: { src: string | null; name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-sky-500 to-blue-600 text-sm font-semibold text-white">
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// ============================================================================
// RoleBadge
// ============================================================================

function RoleBadge({ role }: { role: MemberRole }) {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ============================================================================
// RoleSelector
// ============================================================================

function RoleSelector({
  value,
  onChange,
  disabled,
}: {
  value: "admin" | "member";
  onChange: (role: "admin" | "member") => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as "admin" | "member")}
        disabled={disabled}
        className="appearance-none rounded-lg border border-(--app-border) bg-(--app-surface) py-1.5 pl-3 pr-8 text-sm text-(--app-text-primary) outline-none transition-colors focus:border-(--app-primary) disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="member">成员</option>
        <option value="admin">管理员</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--app-text-muted)" />
    </div>
  );
}

// ============================================================================
// MemberRow — 单个成员行
// 显示：头像 + 用户名（标注"自己"）+ 邮箱 + 角色（owner 显示 Badge / 其他可选角色） + 加入日期 + 操作按钮
// 权限：owner 可改角色和移除；admin 可移除但不能改角色；member 只读
// ============================================================================

function MemberRow({
  member,
  currentUserRole,
  currentUserId,
  onRemove,
  onRoleChange,
}: {
  member: TeamMember;
  currentUserRole: MemberRole | null;
  currentUserId: number | null;
  onRemove: (id: number) => void;
  onRoleChange: (id: number, role: "admin" | "member") => void;
}) {
  // 安全解析加入日期
  const validDate = member.joinedAt && !isNaN(Date.parse(member.joinedAt));
  const joinDate = validDate ? new Date(member.joinedAt).toLocaleDateString("zh-CN") : "-";
  // 权限判断
  const isOwner = member.role === "owner";
  const isSelf = currentUserId !== null && member.userId === currentUserId;
  // 只有 owner 可以修改他人角色，但不能改 owner 自己
  const canModifyRole = currentUserRole === "owner" && !isOwner;
  // owner 和 admin 可以移除成员，但不能移除 owner
  const canRemove = (currentUserRole === "owner" || currentUserRole === "admin") && !isOwner;

  return (
    <div className="flex items-center gap-4 rounded-xl border border-(--app-border) bg-(--app-surface) p-4 transition-all hover:border-(--app-border-strong) hover:shadow-sm">
      <MemberAvatar src={member.avatar} name={member.username} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-(--app-text-primary)">
          {member.username}
          {isSelf && (
            <span className="ml-2 text-xs text-(--app-text-muted)">(你)</span>
          )}
        </p>
        <p className="flex items-center gap-1 truncate text-sm text-(--app-text-secondary)">
          <Mail className="h-3 w-3 shrink-0" />
          {member.email}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {isOwner || !canModifyRole ? (
          <RoleBadge role={member.role} />
        ) : (
          <RoleSelector
            value={member.role as "admin" | "member"}
            onChange={(role) => onRoleChange(member.id, role)}
          />
        )}

        <span className="hidden text-xs text-(--app-text-muted) sm:block">
          {joinDate}
        </span>

        {canRemove && (
          <button
            onClick={() => onRemove(member.id)}
            className="rounded-lg p-2 text-(--app-text-muted) transition-colors hover:bg-(--app-surface-raised) hover:text-red-500"
            title={isSelf ? "离开团队" : "移除成员"}
          >
            {isSelf ? (
              <LogOut className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// InviteForm — 邀请成员表单
// 非管理员：显示"仅管理员可邀请"提示
// 管理员：选择角色（成员/管理员）→ 点击生成链接 → 显示链接 + 复制按钮
// ============================================================================

function InviteForm({
  role,
  isInviting,
  canInvite,
  onRoleChange,
  onInvite,
}: {
  role: "admin" | "member";
  isInviting: boolean;
  canInvite: boolean;
  onRoleChange: (v: "admin" | "member") => void;
  onInvite: () => Promise<InviteLink | null | undefined>;
}) {
  const [generatedLink, setGeneratedLink] = useState<InviteLink | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = !isInviting && canInvite;

  const handleInviteClick = async () => {
    const result = await onInvite();
    if (result) {
      setGeneratedLink(result);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  if (!canInvite) {
    return (
      <div className="rounded-2xl border border-(--app-border) bg-(--app-surface) p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-(--app-primary) to-(--app-accent)">
            <Plus className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-(--app-text-primary)">
              邀请新成员
            </h3>
            <p className="text-xs text-(--app-text-muted)">
              仅管理员可以邀请新成员加入团队
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-(--app-border) bg-(--app-surface) p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-(--app-primary) to-(--app-accent)">
          <Plus className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-(--app-text-primary)">
            邀请新成员
          </h3>
          <p className="text-xs text-(--app-text-muted)">
            生成邀请链接分享给任何人，他们登录后即可申请加入团队
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:w-36">
          <select
            value={role}
            onChange={(e) => { onRoleChange(e.target.value as "admin" | "member"); setGeneratedLink(null); }}
            disabled={isInviting}
            className="w-full appearance-none rounded-lg border border border-(--app-border) bg-(--app-surface) px-4 py-2.5 pr-9 text-sm text-(--app-text-primary) outline-none transition-colors focus:border-(--app-primary) disabled:opacity-50"
          >
            <option value="member">成员</option>
            <option value="admin">管理员</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--app-text-muted)" />
        </div>

        <button
          onClick={() => void handleInviteClick()}
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-linear-to-r from-(--app-primary) to-(--app-accent) px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isInviting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
          {isInviting ? "生成中..." : "生成链接"}
        </button>
      </div>

      {generatedLink && (
        <div className="mt-4 rounded-xl border border-(--app-primary)/30 bg-(--app-primary)/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-(--app-primary)/10">
              <Link2 className="h-3.5 w-3.5 text-(--app-primary)" />
            </div>
            <p className="text-sm font-medium text-(--app-text-primary)">
              邀请链接已生成
            </p>
          </div>
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-(--app-border) bg-(--app-surface) px-3 py-2">
            <p className="flex-1 truncate text-sm text-(--app-text-secondary)">
              {generatedLink.inviteUrl}
            </p>
            <button
              onClick={() => void handleCopy()}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-(--app-primary) transition-colors hover:bg-(--app-primary)/10"
            >
              {copied ? (
                <>
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>复制</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-(--app-text-muted)">
            有效期 7 天，分享链接给任何人申请加入「{generatedLink.teamName}」
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PendingInviteRow — 单条待审核申请行
// 显示：申请人首字母头像 + 姓名 + 申请角色 + 邮箱 + 申请时间 + 批准/拒绝按钮
// ============================================================================

function PendingInviteRow({
  invite,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  invite: PendingInvite;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const validDate = invite.createdAt && !isNaN(Date.parse(invite.createdAt));
  const applyDate = validDate ? new Date(invite.createdAt).toLocaleDateString("zh-CN") : "-";
  const roleLabel = invite.role === "admin" ? "管理员" : "成员";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 transition-all hover:border-amber-500/30">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-amber-400 to-orange-500 text-sm font-semibold text-white">
        {invite.applicantName.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-(--app-text-primary)">
          {invite.applicantName}
        </p>
        <p className="flex items-center gap-2 text-sm text-(--app-text-secondary)">
          <span className="rounded bg-(--app-surface-raised) px-1.5 py-0.5 text-xs">
            {roleLabel}
          </span>
          <span>{invite.applicantEmail}</span>
        </p>
        <p className="text-xs text-(--app-text-muted)">
          申请时间：{applyDate}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => onApprove(invite.id)}
          disabled={isApproving || isRejecting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isApproving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          批准
        </button>
        <button
          onClick={() => onReject(invite.id)}
          disabled={isApproving || isRejecting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-(--app-border) bg-(--app-surface) px-3 py-1.5 text-xs font-medium text-(--app-text-secondary) transition-colors hover:border-red-500 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRejecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          拒绝
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PendingInvitesSection — 待审核申请区块
// 三种状态：加载中（转圈）/ 空列表（时钟图标 + 暂无申请）/ 有数据（列表 + 批准拒绝）
// ============================================================================

function PendingInvitesSection({
  pendingInvites,
  isLoading,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  pendingInvites: PendingInvite[];
  isLoading: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-(--app-border) bg-(--app-surface) p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-semibold text-(--app-text-primary)">
            待审核申请
          </h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-(--app-text-muted)" />
          <span className="ml-2 text-sm text-(--app-text-muted)">加载中...</span>
        </div>
      </div>
    );
  }

  if (pendingInvites.length === 0) {
    return (
      <div className="rounded-2xl border border-(--app-border) bg-(--app-surface) p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          <h3 className="text-base font-semibold text-(--app-text-primary)">
            待审核申请
          </h3>
        </div>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Clock className="h-8 w-8 text-(--app-text-muted) opacity-40" />
          <p className="text-sm text-(--app-text-muted)">暂无待审核的申请</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-(--app-surface) p-6">
      <div className="mb-4 flex items-center gap-2">
        <Bell className="h-5 w-5 text-amber-500" />
        <h3 className="text-base font-semibold text-(--app-text-primary)">
          待审核申请
        </h3>
        <span className="ml-auto rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
          {pendingInvites.length} 人
        </span>
      </div>

      <div className="space-y-3">
        {pendingInvites.map((invite) => (
          <PendingInviteRow
            key={invite.id}
            invite={invite}
            onApprove={onApprove}
            onReject={onReject}
            isApproving={isApproving}
            isRejecting={isRejecting}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// TeamSettings — 团队设置主组件（入口）
// 三步判断：检查中（骨架屏）→ 无团队（创建表单）→ 有团队（管理界面）
// ============================================================================

export function TeamSettings() {
  const [checkingTeam, setCheckingTeam] = useState(true);
  const [hasTeam, setHasTeam] = useState(false);

  // 检查当前用户是否有团队
  useEffect(() => {
    const checkTeam = async () => {
      try {
        const team = await getTeam() as TeamOrNull;
        setHasTeam(team.hasTeam ?? false);
      } catch {
        setHasTeam(false);
      } finally {
        setCheckingTeam(false);
      }
    };
    void checkTeam();
  }, []);

  // 创建团队成功后刷新页面
  const handleTeamCreated = () => {
    window.location.reload();
  };

  if (checkingTeam) {
    return <SettingSkeleton rows={4} message="加载团队信息..." />;
  }

  // 没有团队 → 显示创建团队表单
  if (!hasTeam) {
    return <CreateTeamForm onCreated={handleTeamCreated} />;
  }

  // 有团队 → 显示团队管理 UI
  return <TeamManagement />;
}

// ============================================================================
// TeamManagement — 团队管理主界面
// 布局：邀请表单 + 待审核申请（仅管理员可见）+ 成员列表
// ============================================================================

function TeamManagement() {
  const {
    members,
    currentUserId,
    currentUserRole,
    isLoading,
    isInviting,
    inviteRole,
    setInviteRole,
    handleInvite,
    handleRemove,
    handleRoleChange,
    handleLeave,
    refetch,
  } = useTeam();

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const {
    pendingInvites,
    isLoadingPending,
    isApproving,
    isRejecting,
    handleApprove,
    handleReject,
  } = usePendingInvites(refetch);

  if (isLoading) {
    return <SettingSkeleton rows={4} message="加载团队成员..." />;
  }

  return (
    <div className="space-y-6">
      <InviteForm
        role={inviteRole}
        isInviting={isInviting}
        canInvite={canManage}
        onRoleChange={setInviteRole}
        onInvite={handleInvite}
      />

      {canManage && (
        <PendingInvitesSection
          pendingInvites={pendingInvites}
          isLoading={isLoadingPending}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={isApproving}
          isRejecting={isRejecting}
        />
      )}

      <div className="rounded-2xl border border-(--app-border) bg-(--app-surface) p-6">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-(--app-primary)" />
          <h3 className="text-base font-semibold text-(--app-text-primary)">
            团队成员
          </h3>
          <span className="ml-auto rounded-full bg-(--app-surface-raised) px-2.5 py-0.5 text-xs font-medium text-(--app-text-muted)">
            {members.length} 人
          </span>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Users className="h-10 w-10 text-(--app-text-muted) opacity-40" />
            <p className="text-sm text-(--app-text-muted)">暂无团队成员</p>
            <p className="text-xs text-(--app-text-muted)">
              邀请同事加入团队后将在此显示
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                currentUserRole={currentUserRole}
                currentUserId={currentUserId}
                onRemove={member.userId === currentUserId ? handleLeave : handleRemove}
                onRoleChange={handleRoleChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
