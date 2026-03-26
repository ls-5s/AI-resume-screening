import { config } from "dotenv";
import { resolve } from "node:path";

// 始终从 server/ 目录加载 .env（无论构建为 ESM 还是 CJS）
config({ path: resolve(process.cwd(), ".env") });
