/**
 * 个人资料类型定义
 * 用户资料更新请求参数接口
 */

export interface Profile {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProfileData {
  username?: string;
  avatar?: string;
}
