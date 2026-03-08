import { db } from '../../db/index.js';
import { emailTemplates, emailConfigs } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

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

  return config || null;
}
