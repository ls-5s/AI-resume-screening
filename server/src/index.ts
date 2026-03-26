import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import { testConnection } from "./db/index.js";

import loginRouter from "./routes/login.js";
import settingRouter from "./routes/setting.js";
import emailRouter from "./routes/emailTemplate.js";
import resumeRouter from "./routes/resume.js";
import dashboardRouter from "./routes/dashboard.js";
import templateRouter from "./routes/screeningTemplate.js";

const app: Application = express();

// Middleware：CORS（须由 Vercel Express 单函数处理整站路由，否则会落到 CDN 无 CORS 头）
app.use((req, res, next) => {
  const rawOrigin = req.headers.origin;
  const origin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  const requestedHeaders = req.headers["access-control-request-headers"];
  res.setHeader(
    "Access-Control-Allow-Headers",
    typeof requestedHeaders === "string"
      ? requestedHeaders
      : "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// 静态文件服务 - 提供简历文件访问
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// route
app.use("/v1", loginRouter);
app.use("/v1", settingRouter);
app.use("/v1", emailRouter);
app.use("/v1", resumeRouter);
app.use("/v1", dashboardRouter);
app.use("/v1", templateRouter);

// Express 全局错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // 1. 处理 JWT Token 验证失败（401 未授权）
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      code: 401,
      message: "Token验证失败，请重新登录",
    });
  }

  // 2. 兜底处理所有其他错误（500 服务器错误）
  res.status(500).json({
    code: 500,
    message: err.message || "服务器内部错误",
  });
});

// Vercel Serverless 导出
const vercelHandler = app;
export default vercelHandler;

// 本地开发启动（Vercel 环境不执行此代码）
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`后端服务已启动: http://localhost:${PORT}`);
    const dbConnected = await testConnection();
    if (dbConnected) {
      console.log("数据库连接成功");
    } else {
      console.error("数据库连接失败");
    }
  });
}
