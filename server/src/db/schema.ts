import { mysqlTable, serial, varchar, text, timestamp, longtext, int, boolean } from 'drizzle-orm/mysql-core';
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
});

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

// 表关系定义
export const usersRelations = relations(users, ({ many }) => ({
  emailConfigs: many(emailConfigs),
}));

export const emailConfigsRelations = relations(emailConfigs, ({ one }) => ({
  user: one(users, {
    fields: [emailConfigs.userId],
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