import express, { Request, Response, Router } from 'express';
import { getDashboardStats, createActivity } from '../services/dashboard/dashboard.js';

const router: Router = express.Router();

/**
 * 获取 Dashboard 统计数据
 */
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const data = await getDashboardStats();
    res.json({
      code: 200,
      data
    });
  } catch (error: any) {
    console.error('获取 Dashboard 统计失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取统计失败'
    });
  }
});

/**
 * 记录活动
 */
router.post('/activity', async (req: Request, res: Response) => {
  try {
    const { type, resumeId, resumeName, description } = req.body;
    
    // 获取用户ID（暂时用默认值，后续可以改成从 token 获取）
    const userId = Number((req as any).user?.id) || 1;

    // 验证类型
    const validTypes = ['upload', 'screening', 'pass', 'reject', 'interview'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        code: 400,
        message: '无效的活动类型'
      });
    }

    await createActivity({
      userId,
      type,
      resumeId,
      resumeName,
      description
    });

    res.json({
      code: 200,
      message: '活动记录成功'
    });
  } catch (error: any) {
    console.error('记录活动失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '记录活动失败'
    });
  }
});

export default router;
