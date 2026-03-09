import { mysqlTable, serial, varchar, text, timestamp, longtext, int, boolean, index } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// 用户表
export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  avatar: longtext('avatar'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (users) => ({
  emailIdx: index('email_idx').on(users.email),
}));

// 简历表
export const resumes = mysqlTable('resumes', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull().references(() => users.id), // 关联用户
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  resumeFile: varchar('resume_file', { length: 500 }),
  originalFileName: varchar('original_file_name', { length: 500 }), // 原始文件名
  fileType: varchar('file_type', { length: 20 }), // 文件类型: pdf, docx, doc
  fileSize: int('file_size'), // 文件大小（字节）
  summary: text('summary'),
  parsedContent: longtext('parsed_content'), // 解析后的文本内容
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 简历状态: pending(待筛选), rejected(拒绝), passed(通过)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (resumes) => ({
  userIdIdx: index('resume_user_id_idx').on(resumes.userId),
  emailIdx: index('resume_email_idx').on(resumes.email),
}));

// 邮箱配置表
export const emailConfigs = mysqlTable('email_configs', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  email: varchar('email', { length: 255 }).notNull(), // QQ 邮箱地址（明文）
  authCode: varchar('auth_code', { length: 500 }).notNull(), // 16位授权码（AES加密后存储）
  imapHost: varchar('imap_host', { length: 100 }).default('imap.qq.com'), // IMAP 服务器
  imapPort: int('imap_port').default(993), // IMAP 端口
  smtpHost: varchar('smtp_host', { length: 100 }).default('smtp.qq.com'), // SMTP 服务器
  smtpPort: int('smtp_port').default(465), // SMTP 端口
  isDefault: boolean('is_default').default(false), // 是否为默认发件邮箱
  isDeleted: boolean('is_deleted').default(false), // 软删除
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 邮件模板表
export const emailTemplates = mysqlTable('email_templates', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(), // 模板名称
  subject: varchar('subject', { length: 500 }).notNull(), // 邮件主题
  body: longtext('body').notNull(), // 邮件正文
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (emailTemplates) => ({
  userIdIdx: index('email_template_user_id_idx').on(emailTemplates.userId),
}));

// AI 配置表
export const aiConfigs = mysqlTable('ai_configs', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 100 }).notNull().default('默认配置'), // 配置名称
  model: varchar('model', { length: 100 }).notNull().default('gpt-4o'), // AI 模型
  apiUrl: varchar('api_url', { length: 500 }).notNull().default('https://api.openai.com/v1'), // API 地址
  apiKey: varchar('api_key', { length: 500 }), // API Key（AES加密存储）
  prompt: longtext('prompt'), // AI 提示词
  isDefault: boolean('is_default').default(false), // 是否为默认配置
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (aiConfigs) => ({
  userIdIdx: index('ai_config_user_id_idx').on(aiConfigs.userId),
}));

// 活动日志表
export const activities = mysqlTable('activities', {
  id: serial('id').primaryKey(),
  userId: int('user_id').notNull().references(() => users.id),
  type: varchar('type', { length: 50 }).notNull(), // activity 类型: upload(上传简历), screening(AI筛选), pass(通过筛选), reject(拒绝), interview(发送面试邀请)
  resumeId: int('resume_id'), // 关联的简历ID
  resumeName: varchar('resume_name', { length: 255 }), // 简历名称（冗余存储，避免删除后丢失）
  description: varchar('description', { length: 500 }), // 活动描述
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (activities) => ({
  userIdIdx: index('activity_user_id_idx').on(activities.userId),
  createdAtIdx: index('activity_created_at_idx').on(activities.createdAt),
}));

// 表关系定义
export const usersRelations = relations(users, ({ many }) => ({
  emailConfigs: many(emailConfigs),
  emailTemplates: many(emailTemplates),
  resumes: many(resumes),
  aiConfigs: many(aiConfigs),
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
}));

export const emailConfigsRelations = relations(emailConfigs, ({ one }) => ({
  user: one(users, {
    fields: [emailConfigs.userId],
    references: [users.id],
  }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  user: one(users, {
    fields: [emailTemplates.userId],
    references: [users.id],
  }),
}));

export const aiConfigsRelations = relations(aiConfigs, ({ one }) => ({
  user: one(users, {
    fields: [aiConfigs.userId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

// 导出类型
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type EmailConfig = typeof emailConfigs.$inferSelect;
export type NewEmailConfig = typeof emailConfigs.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
export type AiConfig = typeof aiConfigs.$inferSelect;
export type NewAiConfig = typeof aiConfigs.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;