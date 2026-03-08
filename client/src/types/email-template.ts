// 邮件模板类型定义

export interface EmailTemplate {
  id: number;
  userId: number;
  name: string;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailTemplateData {
  name: string;
  subject: string;
  body: string;
}

export interface UpdateEmailTemplateData {
  name?: string;
  subject?: string;
  body?: string;
}

// 发送邮件相关
export interface SendEmailData {
  templateId?: number;
  candidateIds: number[];
  subject: string;
  body: string;
  fromEmailId: number;
}

export interface SendEmailResult {
  success: boolean;
  message: string;
  sentCount: number;
  failedCount: number;
}

// 收件人类型
export interface EmailRecipient {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
}
