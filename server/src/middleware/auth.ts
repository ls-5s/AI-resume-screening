import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

// 验证 Token 的中间件
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: '未授权，请先登录'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    // 验证用户是否存在于数据库中（防止数据库重建后 token 仍有效）
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, decoded.id))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在，请重新登录'
      });
    }

    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({
      code: 401,
      message: 'Token 已过期，请重新登录'
    });
  }
};
