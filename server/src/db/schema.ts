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
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  resumeFile: varchar('resume_file', { length: 500 }),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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

// 表关系定义
export const usersRelations = relations(users, ({ many }) => ({
  emailConfigs: many(emailConfigs),
  emailTemplates: many(emailTemplates),
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

// 导出类型
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type EmailConfig = typeof emailConfigs.$inferSelect;
export type NewEmailConfig = typeof emailConfigs.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;