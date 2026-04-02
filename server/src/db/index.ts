import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// 环境变量由以下来源提供（优先级从高到低）：
//   1. Vercel Dashboard / vercel env add（生产环境）
//   2. process.env（Vercel Build / 本地 .env 经 dotenv 注入）
// 注意：不要在生产代码中引用 loadEnv.ts，它仅用于本地 tsx 开发。
const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
const tursoToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!tursoUrl) {
  throw new Error(
    "TURSO_DATABASE_URL 未配置。请在 Vercel Dashboard → Settings → Environment Variables 中添加 " +
    "TURSO_DATABASE_URL 和 TURSO_AUTH_TOKEN，或在本地 .env 中配置（详见 server/.env.example）。",
  );
}

const client = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});

export const db = drizzle(client, { schema });

export async function testConnection(): Promise<boolean> {
  try {
    await client.execute("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

/**
 * 启动时自动创建 teams / team_members 表（如不存在）。
 * 只在本地开发模式执行，生产由 drizzle-kit push 管理。
 */
export async function ensureTables(): Promise<void> {
  // 仅本地 tsx 开发时需要自动建表
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) return;

  const migrations = [
    `CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, user_id)
    )`,
    `CREATE INDEX IF NOT EXISTS team_member_team_id_idx ON team_members(team_id)`,
    `CREATE INDEX IF NOT EXISTS team_member_user_id_idx ON team_members(user_id)`,
    // resumes.team_id 列（可能已在旧迁移中创建，用 IF NOT EXISTS 不支持，忽略错误）
    `ALTER TABLE resumes ADD COLUMN team_id INTEGER REFERENCES teams(id)`,
    // 团队邀请表
    `CREATE TABLE IF NOT EXISTS team_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      inviter_id INTEGER NOT NULL REFERENCES users(id),
      invitee_email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'member',
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS team_invite_team_id_idx ON team_invites(team_id)`,
    `CREATE INDEX IF NOT EXISTS team_invite_token_idx ON team_invites(token)`,
    `CREATE INDEX IF NOT EXISTS team_invite_email_idx ON team_invites(invitee_email)`,
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch (err: unknown) {
      // 忽略 "table already exists" / "no such column" 等非致命错误
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("already exists") ||
        msg.includes("no such column") ||
        msg.includes("duplicate column")
      ) {
        continue;
      }
      console.warn("[ensureTables] 迁移警告:", msg);
    }
  }
}

export { client };
