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

export { client };
