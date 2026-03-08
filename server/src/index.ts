import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { testConnection } from './db/index.js';

import loginRouter from './routes/login.js';
import settingRouter from './routes/setting.js';
import emailRouter from './routes/emailTemplate.js';
const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// route

app.use('/v1', loginRouter);
app.use('/v1', settingRouter);
app.use('/v1', emailRouter);
// Express 全局错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // 1. 处理 JWT Token 验证失败（401 未授权）
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      code: 401,
      message: 'Token验证失败，请重新登录'
    });
  }

  // 2. 兜底处理所有其他错误（500 服务器错误）
  res.status(500).json({
    code: 500,
    message: err.message || '服务器内部错误'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  // 启动时检测数据库连接
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('✅ Database connected successfully');
  } else {
    console.log('❌ Database connection failed');
  }
});

export default app;
