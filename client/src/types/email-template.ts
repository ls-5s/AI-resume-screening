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
  /** 实际发送成功的候选人 ID（与后端一致） */
  successfulCandidateIds?: number[];
}

// 收件人类型（从简历表获取）
export interface EmailRecipient {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: 'pending' | 'passed' | 'rejected';
  resumeFile: string | null;
  originalFileName: string | null;
}
