import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  sendEmails,
  getEmailRecipients,
} from '../services/email/template.js';

const router: RouterType = Router();

// ============ 邮件模板相关接口 ============

// 获取邮件模板列表
router.get('/email-templates', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const templates = await getEmailTemplates(userId);
    
    res.status(200).json({
      code: 200,
      data: templates,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取邮件模板失败';
    res.status(400).json({
      code: 400,
      message,
    });
  }
});

// 获取单个邮件模板
router.get('/email-templates/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const templateId = parseInt(req.params.id as string, 10);
    
    if (isNaN(templateId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的模板ID',
      });
    }
    
    const template = await getEmailTemplateById(userId, templateId);
    
    if (!template) {
      return res.status(404).json({
        code: 404,
        message: '邮件模板不存在',
      });
    }
    
    res.status(200).json({
      code: 200,
      data: template,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取邮件模板失败';
    res.status(400).json({
      code: 400,
      message,
    });
  }
});

// 创建邮件模板
router.post('/email-templates', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, subject, body } = req.body;
    
    if (!name || !subject || !body) {
      return res.status(400).json({
        code: 400,
        message: '模板名称、主题和内容不能为空',
      });
    }
    
    const template = await createEmailTemplate(userId, {
      name,
      subject,
      body,
    });
    
    res.status(201).json({
      code: 201,
      data: template,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建邮件模板失败';
    res.status(400).json({
      code: 400,
      message,
    });
  }
});

// 更新邮件模板
router.put('/email-templates/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const templateId = parseInt(req.params.id as string, 10);
    
    if (isNaN(templateId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的模板ID',
      });
    }
    
    const { name, subject, body } = req.body;
    
    const template = await updateEmailTemplate(userId, templateId, {
      name,
      subject,
      body,
    });
    
    res.status(200).json({
      code: 200,
      data: template,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新邮件模板失败';
    res.status(400).json({
      code: 400,
      message,
    });
  }
});

// 删除邮件模板
router.delete('/email-templates/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const templateId = parseInt(req.params.id as string, 10);
    
    if (isNaN(templateId)) {
      return res.status(400).json({
        code: 400,
        message: '无效的模板ID',
      });
    }
    
    await deleteEmailTemplate(userId, templateId);
    
    res.status(200).json({
      code: 200,
      message: '删除成功',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除邮件模板失败';
    res.status(400).json({
      code: 400,
      message,
    });
  }
});

// ============ 发送邮件相关接口 ============

// 获取收件人列表
router.get('/email-recipients', authenticate, async (req: Request, res: Response) => {
  try {
    const recipients = await getEmailRecipients();
    
    res.status(200).json({
      code: 200,
      data: recipients,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取收件人列表失败';
    res.status(400).json({
      code: 400,
      message,
    });
  }
});

// 发送邮件
router.post('/emails/send', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = Number((req as any).user.id);
    console.log('发送邮件 - userId:', userId, 'body:', req.body);
    const { candidateIds, subject, body, fromEmailId } = req.body;
    
    if (!fromEmailId || !subject || !body) {
      return res.status(400).json({
        code: 400,
        message: '发件邮箱、主题和内容不能为空',
      });
    }
    
    const result = await sendEmails(userId, {
      candidateIds: candidateIds || [],
      subject,
      body,
      fromEmailId,
    });
    
    console.log('发送结果:', result);
    res.status(200).json({
      code: result.success ? 200 : 400,
      data: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '发送邮件失败';
    console.error('发送邮件错误:', err);
    res.status(400).json({
      code: 400,
      message,
    });
  }
});

export default router;
