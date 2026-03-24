import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getProfile, updateProfile } from "../../api/profile";
import {
  User,
  Mail,
  Save,
  Camera,
  CheckCircle2,
  AlertCircle,
  Shield,
  Bell,
  Loader2,
  Undo2,
} from "lucide-react";
import toast from "../../utils/toast";
import { useLoginStore } from "../../store/Login";

// ============================================================================
// Types
// ============================================================================

interface ProfileData {
  username: string;
  email: string;
  avatar: string | null;
}

interface ProfileFormData {
  username: string;
  avatar: string | null;
}

interface UseProfileReturn {
  profile: ProfileData | null;
  formData: ProfileFormData;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  isAvatarUploading: boolean;
  updateField: <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => void;
  handleAvatarChange: (file: File) => void;
  save: () => Promise<boolean>;
  reset: () => void;
  discardAvatar: () => void;
}

interface FieldValidation {
  username: { valid: boolean; message: string };
}

// ============================================================================
// Custom Hook: useProfile
// ============================================================================

function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({ username: "", avatar: null });
  const [originalData, setOriginalData] = useState<ProfileFormData>({ username: "", avatar: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const pendingAvatarRef = useRef<string | null>(null);

  // Load profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await getProfile();
        setProfile(data);
        const initialForm = { username: data.username, avatar: data.avatar };
        setFormData(initialForm);
        setOriginalData(initialForm);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("加载个人信息失败");
      } finally {
        setIsLoading(false);
      }
    };
    void fetchProfile();
  }, []);

  // Check if form has unsaved changes
  const isDirty = useMemo(() => {
    return (
      formData.username !== originalData.username ||
      formData.avatar !== originalData.avatar
    );
  }, [formData, originalData]);

  // Update specific field
  const updateField = useCallback(<K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Handle avatar upload
  const handleAvatarChange = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("图片大小不能超过 2MB");
      return;
    }

    setIsAvatarUploading(true);
    try {
      const reader = new FileReader();
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => {
          pendingAvatarRef.current = reader.result as string;
          resolve();
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      setFormData((prev) => ({ ...prev, avatar: pendingAvatarRef.current }));
      toast.success("头像已更新，保存后生效");
    } catch {
      toast.error("头像处理失败");
    } finally {
      setIsAvatarUploading(false);
    }
  }, []);

  // Save profile with optimistic update
  const save = useCallback(async (): Promise<boolean> => {
    const trimmedUsername = formData.username.trim();
    if (!trimmedUsername) {
      toast.error("用户名不能为空");
      return false;
    }

    // Store original data for potential rollback
    const snapshot = { username: profile?.username ?? "", avatar: profile?.avatar ?? null };

    // Optimistic update
    setProfile((prev) => prev ? { ...prev, username: trimmedUsername, avatar: formData.avatar ?? prev.avatar } : null);
    setOriginalData({ username: trimmedUsername, avatar: formData.avatar });
    setIsSaving(true);

    try {
      const updated = await updateProfile({
        username: trimmedUsername,
        avatar: formData.avatar || undefined,
      });

      setProfile(updated);
      setOriginalData({ username: updated.username, avatar: updated.avatar });
      setFormData({ username: updated.username, avatar: updated.avatar });

      // Sync with global login store
      const setUser = useLoginStore.getState().setUser;
      setUser({ username: updated.username, avatar: updated.avatar });

      toast.success("个人信息已更新");
      return true;
    } catch (error: unknown) {
      // Rollback on failure
      setProfile((prev) => prev ? { ...prev, username: snapshot.username, avatar: snapshot.avatar } : null);
      setOriginalData(snapshot);
      setFormData((prev) => ({ ...prev, username: snapshot.username, avatar: snapshot.avatar }));

      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "保存失败");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [formData, profile]);

  // Reset form to original values
  const reset = useCallback(() => {
    setFormData({ username: originalData.username, avatar: originalData.avatar });
  }, [originalData]);

  // Discard only the avatar change
  const discardAvatar = useCallback(() => {
    setFormData((prev) => ({ ...prev, avatar: originalData.avatar }));
  }, [originalData]);

  return {
    profile,
    formData,
    isLoading,
    isSaving,
    isDirty,
    isAvatarUploading,
    updateField,
    handleAvatarChange,
    save,
    reset,
    discardAvatar,
  };
}

// ============================================================================
// Validation Hook
// ============================================================================

function useValidation(username: string, isEditing: boolean): FieldValidation {
  return useMemo(() => {
    if (!isEditing) {
      return { username: { valid: true, message: "" } };
    }
    if (!username.trim()) {
      return { username: { valid: false, message: "用户名不能为空" } };
    }
    if (username.length < 2) {
      return { username: { valid: false, message: "用户名至少需要2个字符" } };
    }
    if (username.length > 20) {
      return { username: { valid: false, message: "用户名不能超过20个字符" } };
    }
    return { username: { valid: true, message: "" } };
  }, [username, isEditing]);
}

// ============================================================================
// Debounce Hook
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// Sub-components
// ============================================================================

interface AvatarProps {
  src: string | null;
  name: string;
  size: "sm" | "md" | "lg" | "xl";
  isUploading?: boolean;
}

function Avatar({ src, name, size, isUploading }: AvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-16 w-16 text-xl",
    xl: "h-24 w-24 text-3xl",
  };

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-sky-500 to-blue-600 shadow-lg transition-transform duration-200 ${sizeClasses[size]}`}
    >
      {isUploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      ) : src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-bold text-white">{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  editable?: boolean;
  children?: React.ReactNode;
}

function InfoCard({ icon, label, value, editable, children }: InfoCardProps) {
  return (
    <div className="group relative rounded-2xl border border-zinc-200/60 bg-white p-4 transition-all duration-200 hover:border-zinc-300 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </p>
          <div className="mt-1">{value}</div>
        </div>
        {editable && (
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ProfileSettings() {
  const {
    profile,
    formData,
    isLoading,
    isSaving,
    isDirty,
    isAvatarUploading,
    updateField,
    handleAvatarChange,
    save,
    reset,
  } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  const validation = useValidation(formData.username, isEditing);
  const debouncedUsername = useDebounce(formData.username, 300);
  const hasUsernameWarning = isEditing && debouncedUsername !== (profile?.username ?? "") && !validation.username.valid;

  // Focus username input when entering edit mode
  useEffect(() => {
    if (isEditing && usernameInputRef.current) {
      usernameInputRef.current.focus();
      usernameInputRef.current.select();
    }
  }, [isEditing]);

  // Handle file selection
  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarChange(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleAvatarChange]);

  // Handle save
  const onSave = useCallback(async () => {
    const success = await save();
    if (success) {
      setIsEditing(false);
    }
  }, [save]);

  // Handle cancel
  const onCancel = useCallback(() => {
    reset();
    setIsEditing(false);
  }, [reset]);

  // Handle edit toggle
  const toggleEdit = useCallback(() => {
    if (isEditing && isDirty) {
      if (confirm("有未保存的更改，确定要取消吗？")) {
        onCancel();
      }
    } else {
      setIsEditing(!isEditing);
    }
  }, [isEditing, isDirty, onCancel]);

  // Display avatar (use form data for preview)
  const displayAvatar = formData.avatar ?? profile?.avatar ?? null;
  const displayName = formData.username || profile?.username || "未设置用户名";

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 animate-pulse rounded-full bg-zinc-200" />
            <div className="space-y-3">
              <div className="h-6 w-40 animate-pulse rounded bg-zinc-200" />
              <div className="h-4 w-56 animate-pulse rounded bg-zinc-200" />
            </div>
          </div>
        </div>
        {/* Cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Banner gradient */}
        <div className="h-24 bg-linear-to-br from-sky-500/10 via-blue-500/10 to-indigo-500/10" />

        <div className="relative px-6 pb-6">
          {/* Avatar with edit overlay */}
          <div className="absolute -top-12 left-6">
            <div
              className="relative"
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
            >
              <Avatar
                src={displayAvatar}
                name={displayName}
                size="xl"
              />

              {/* Edit overlay */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isAvatarUploading}
                aria-label="更换头像"
                className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-all duration-200 ${
                  isAvatarHovered || isAvatarUploading
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              >
                <div className="flex flex-col items-center text-white">
                  <Camera className="h-6 w-6" />
                  <span className="mt-1 text-xs font-medium">更换</span>
                </div>
              </button>

              {/* Pending indicator */}
              {formData.avatar !== profile?.avatar && formData.avatar && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-sm">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
              aria-label="上传头像"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end pt-4">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onCancel}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-50"
                >
                  <Undo2 className="h-4 w-4" />
                  取消
                </button>
                <button
                  onClick={onSave}
                  disabled={isSaving || !validation.username.valid}
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      保存更改
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={toggleEdit}
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-105"
              >
                编辑资料
              </button>
            )}
          </div>

          {/* User info */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              {isEditing ? (
                <div className="space-y-1">
                  <input
                    ref={usernameInputRef}
                    type="text"
                    value={formData.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    maxLength={20}
                    placeholder="输入用户名"
                    className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-xl font-semibold text-zinc-900 outline-none transition-colors ${
                      hasUsernameWarning
                        ? "border-amber-400 focus:border-amber-500"
                        : "border-transparent focus:border-sky-400"
                    }`}
                  />
                  {hasUsernameWarning && (
                    <p className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      {validation.username.message}
                    </p>
                  )}
                </div>
              ) : (
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {displayName}
                </h1>
              )}

              <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                <Mail className="h-4 w-4" />
                {profile?.email ?? "-"}
              </p>

              {/* Status badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600 ring-1 ring-inset ring-sky-100">
                  <Shield className="h-3 w-3" />
                  个人账户
                </span>
                {profile?.avatar && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-100">
                    <CheckCircle2 className="h-3 w-3" />
                    已上传头像
                  </span>
                )}
                {isDirty && isEditing && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-100">
                    <AlertCircle className="h-3 w-3" />
                    有未保存的更改
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard
          icon={<User className="h-5 w-5" />}
          label="用户名"
          value={
            isEditing ? (
              <input
                type="text"
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value)}
                maxLength={20}
                className={`w-full rounded-lg border bg-white px-2 py-1 text-sm font-medium outline-none transition-colors ${
                  hasUsernameWarning
                    ? "border-amber-400 text-amber-700"
                    : "border-transparent text-zinc-900"
                }`}
              />
            ) : (
              <p className="text-sm font-medium text-zinc-900">
                {profile?.username ?? "-"}
              </p>
            )
          }
          editable={isEditing}
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-xs font-medium text-sky-600">
            <User className="h-3 w-3" />
            可编辑
          </span>
        </InfoCard>

        <InfoCard
          icon={<Mail className="h-5 w-5" />}
          label="邮箱"
          value={
            <p className="text-sm font-medium text-zinc-900">
              {profile?.email ?? "-"}
            </p>
          }
        >
          {!isEditing && (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500">
              <Bell className="h-3 w-3" />
              联系管理员修改
            </span>
          )}
        </InfoCard>
      </div>

      {/* Help text when not editing */}
      {!isEditing && (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/40 p-4">
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <AlertCircle className="h-4 w-4 shrink-0 text-zinc-400" />
            如需修改邮箱或其他信息，请联系管理员处理。
          </p>
        </div>
      )}
    </div>
  );
}
