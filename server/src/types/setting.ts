// 邮箱配置相关类型

export interface EmailConfigInput {
  email: string;
  authCode: string;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  isDefault?: boolean;
}

export interface EmailConfigResponse {
  id: number;
  userId: number;
  email: string;
  authCode?: string; // 授权码（可选返回）
  imapHost: string | null;
  imapPort: number | null;
  smtpHost: string | null;
  smtpPort: number | null;
  isDefault: boolean | null;
  isDeleted: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}
