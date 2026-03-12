import { useState, useEffect, useRef } from "react";
import { getProfile, updateProfile } from "../../api/profile";
import { User, Mail, Pencil, Save, X, Camera } from "lucide-react";
import toast from "../Toast";
import { useLoginStore } from "../../store/Login";

export function ProfileSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<{ username: string; email: string; avatar: string | null } | null>(null);
  const [editForm, setEditForm] = useState({ username: "", email: "" });
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取用户信息
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
        setEditForm({ username: data.username, email: data.email });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const displayAvatar = newAvatar || profile?.avatar;

  // 处理头像选择
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    // 验证文件大小 (最大 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("图片大小不能超过 2MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64 = reader.result as string;
        setNewAvatar(base64);
        toast.success("头像上传成功");
        setIsUploadingAvatar(false);
      };

      reader.onerror = () => {
        toast.error("图片读取失败，请重试");
        setIsUploadingAvatar(false);
      };
    } catch (error) {
      console.error("Failed to process avatar:", error);
      toast.error("头像处理失败，请重试");
      setIsUploadingAvatar(false);
    }

    // 清空 input 以便重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.username.trim()) {
      toast.error("用户名不能为空");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        username: editForm.username,
        avatar: newAvatar || undefined,
      });
      setProfile(updated);
      setNewAvatar(null);
      setIsEditing(false);
      toast.success("个人信息更新成功");

      // 同步更新全局 store
      const setUser = useLoginStore.getState().setUser;
      setUser({ username: updated.username, avatar: updated.avatar });
    } catch (error: unknown) {
      console.error("Failed to update profile:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || "更新失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({ username: profile?.username || "", email: profile?.email || "" });
    setNewAvatar(null);
    setIsEditing(false);
  };

  return (
    <>
      {/* 设置项卡片 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">个人信息</h2>
            <p className="text-sm text-gray-500 mt-1">管理您的个人资料</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              编辑
            </button>
          )}
        </div>

        {/* 头像区域 */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative group">
            <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={profile?.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {(isEditing ? editForm.username : profile?.username || "用户").charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* 编辑模式下的上传按钮 */}
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white" />
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              aria-label="上传头像"
            />
          </div>
        </div>

        {/* 编辑模式 */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入用户名"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  placeholder="邮箱不可修改"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-8">邮箱不可修改</p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    保存
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* 查看模式 */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">用户名</p>
                <p className="text-sm font-medium text-gray-900">{profile?.username || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">邮箱</p>
                <p className="text-sm font-medium text-gray-900">{profile?.email || "-"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
