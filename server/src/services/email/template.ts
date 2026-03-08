import { db } from '../../db/index.js';
import { emailTemplates, emailConfigs, users } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import nodemailer from 'nodemailer';

export interface EmailTemplateInput {
  name: string;
  subject: string;
  body: string;
}

export interface EmailTemplateResponse {
  id: number;
  userId: number;
  name: string;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

// 获取用户的邮件模板列表
export async function getEmailTemplates(userId: number): Promise<EmailTemplateResponse[]> {
  const templates = await db
    .select({
      id: emailTemplates.id,
      userId: emailTemplates.userId,
      name: emailTemplates.name,
      subject: emailTemplates.subject,
      body: emailTemplates.body,
      createdAt: emailTemplates.createdAt,
      updatedAt: emailTemplates.updatedAt,
    })
    .from(emailTemplates)
    .where(eq(emailTemplates.userId, userId));

  return templates;
}

// 获取单个邮件模板
export async function getEmailTemplateById(
  userId: number,
  templateId: number
): Promise<EmailTemplateResponse | null> {
  const [template] = await db
    .select({
      id: emailTemplates.id,
      userId: emailTemplates.userId,
      name: emailTemplates.name,
      subject: emailTemplates.subject,
      body: emailTemplates.body,
      createdAt: emailTemplates.createdAt,
      updatedAt: emailTemplates.updatedAt,
    })
    .from(emailTemplates)
    .where(and(
      eq(emailTemplates.id, templateId),
      eq(emailTemplates.userId, userId)
    ));

  return template || null;
}

// 创建邮件模板
export async function createEmailTemplate(
  userId: number,
  data: EmailTemplateInput
): Promise<EmailTemplateResponse> {
  const [result] = await db
    .insert(emailTemplates)
    .values({
      userId,
      name: data.name,
      subject: data.subject,
      body: data.body,
    });

  const [template] = await db
    .select({
      id: emailTemplates.id,
      userId: emailTemplates.userId,
      name: emailTemplates.name,
      subject: emailTemplates.subject,
      body: emailTemplates.body,
      createdAt: emailTemplates.createdAt,
      updatedAt: emailTemplates.updatedAt,
    })
    .from(emailTemplates)
    .where(eq(emailTemplates.id, result.insertId));

  return template;
}

// 更新邮件模板
export async function updateEmailTemplate(
  userId: number,
  templateId: number,
  data: Partial<EmailTemplateInput>
): Promise<EmailTemplateResponse> {
  // 检查模板是否存在且属于该用户
  const existing = await getEmailTemplateById(userId, templateId);
  if (!existing) {
    throw new Error('邮件模板不存在');
  }

  // 构建更新数据
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.subject !== undefined) updateData.subject = data.subject;
  if (data.body !== undefined) updateData.body = data.body;

  await db
    .update(emailTemplates)
    .set(updateData)
    .where(and(
      eq(emailTemplates.id, templateId),
      eq(emailTemplates.userId, userId)
    ));

  const updated = await getEmailTemplateById(userId, templateId);
  if (!updated) {
    throw new Error('更新失败');
  }

  return updated;
}

// 删除邮件模板
export async function deleteEmailTemplate(
  userId: number,
  templateId: number
): Promise<void> {
  const existing = await getEmailTemplateById(userId, templateId);
  if (!existing) {
    throw new Error('邮件模板不存在');
  }

  await db
    .delete(emailTemplates)
    .where(and(
      eq(emailTemplates.id, templateId),
      eq(emailTemplates.userId, userId)
    ));
}

// 获取邮箱配置（用于发送邮件）
export async function getEmailConfigById(
  userId: number,
  configId: number
): Promise<{
  id: number;
  email: string;
  authCode: string;
  smtpHost: string;
  smtpPort: number;
} | null> {
  console.log('getEmailConfigById - userId:', userId, 'configId:', configId);
  
  const [config] = await db
    .select({
      id: emailConfigs.id,
      email: emailConfigs.email,
      authCode: emailConfigs.authCode,
      smtpHost: emailConfigs.smtpHost,
      smtpPort: emailConfigs.smtpPort,
    })
    .from(emailConfigs)
    .where(and(
      eq(emailConfigs.id, configId),
      eq(emailConfigs.userId, userId),
      eq(emailConfigs.isDeleted, false)
    ));

  console.log('getEmailConfigById - config:', config);
  return config || null;
}

// 发送邮件接口
export interface SendEmailInput {
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

// 变量替换函数
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// 收件人类型
export interface EmailRecipient {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
}

// 获取收件人列表（从 users 表）
export async function getEmailRecipients(): Promise<EmailRecipient[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      avatar: users.avatar,
    })
    .from(users);

  return rows;
}

// 发送邮件
export async function sendEmails(
  userId: number,
  data: SendEmailInput
): Promise<SendEmailResult> {
  console.log('sendEmails - userId:', userId, 'data:', data);
  
  // 获取发件邮箱配置
  const emailConfig = await getEmailConfigById(userId, data.fromEmailId);
  console.log('sendEmails - emailConfig:', emailConfig);
  
  if (!emailConfig) {
    throw new Error('邮箱配置不存在，请检查是否选择了正确的发件邮箱');
  }

  // 从 users 表获取收件人列表
  const allRecipients = await getEmailRecipients();

  // 过滤需要发送的收件人
  const targetCandidates = allRecipients.filter(c => data.candidateIds.includes(c.id));

  if (targetCandidates.length === 0) {
    // 如果没有指定收件人，发送给所有人
    targetCandidates.push(...allRecipients);
  }

  if (targetCandidates.length === 0) {
    return {
      success: false,
      message: '没有可发送的收件人',
      sentCount: 0,
      failedCount: 0,
    };
  }

  // 创建 nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtpHost,
    port: emailConfig.smtpPort,
    secure: emailConfig.smtpPort === 465, // SSL
    auth: {
      user: emailConfig.email,
      pass: emailConfig.authCode,
    },
  });

  let sentCount = 0;
  let failedCount = 0;

  // 逐个发送邮件
  for (const candidate of targetCandidates) {
    try {
      const variables = {
        name: candidate.username || candidate.email,
        email: candidate.email,
        phone: '',
        position: '应聘职位',
      };

      const subject = replaceVariables(data.subject, variables);
      const body = replaceVariables(data.body, variables);

      await transporter.sendMail({
        from: emailConfig.email,
        to: candidate.email,
        subject: subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });

      sentCount++;
    } catch (error) {
      console.error(`发送邮件给 ${candidate.email} 失败:`, error);
      failedCount++;
    }
  }

  return {
    success: sentCount > 0,
    message: `发送完成：成功 ${sentCount} 封，失败 ${failedCount} 封`,
    sentCount,
    failedCount,
  };
}
