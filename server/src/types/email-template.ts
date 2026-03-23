// 邮件模板相关类型

// 创建邮件模板输入
export interface EmailTemplateInput {
  name: string;
  subject: string;
  body: string;
}

// 邮件模板响应
export interface EmailTemplateResponse {
  id: number;
  userId: number;
  name: string;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

// 发送邮件输入
export interface SendEmailInput {
  candidateIds: number[];
  subject: string;
  body: string;
  fromEmailId: number;
}

// 发送邮件结果
export interface SendEmailResult {
  success: boolean;
  message: string;
  sentCount: number;
  failedCount: number;
  /** 实际发送成功的候选人（简历）ID，供前端展示「发送成功」状态 */
  successfulCandidateIds: number[];
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
