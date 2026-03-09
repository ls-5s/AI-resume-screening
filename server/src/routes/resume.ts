import express, { Request, Response, Router } from 'express';
import path from 'path';
import fs from 'fs';
import { db } from '../db/index.js';
import { resumes, emailConfigs } from '../db/schema.js';
import { parseDocument, getFileType } from '../services/resume/parser.js';
import { eq, desc } from 'drizzle-orm';
import { extractContactInfo, upload } from '../utils/resume.js';
import { authenticate } from '../middleware/auth.js';
import { fetchEmailsWithAttachments, saveAttachmentToResume } from '../services/resume/fetcher.js';

// 简历状态类型
type ResumeStatus = 'pending' | 'rejected' | 'passed';

const router: Router = express.Router();

/**
 * 上传简历
 */
router.post('/resume/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的文件'
      });
    }

    const file = req.file;
    // 解码文件名（处理浏览器对中文文件名的 URL 编码）
    const originalFileName = decodeURIComponent(file.originalname);
    const fileType = getFileType(originalFileName);
    const fileSize = file.size;
    const filePath = file.path;

    console.log('收到上传文件:', {
      originalFileName,
      fileType,
      fileSize,
      filePath
    });

    // 解析文档内容
    const parseResult = await parseDocument(filePath, originalFileName);
    
    if (parseResult.error) {
      // 删除上传的文件
      fs.unlinkSync(filePath);
      console.error('文档解析失败:', parseResult.error);
      return res.status(400).json({
        code: 400,
        message: parseResult.error
      });
    }

    // 从解析内容中提取联系信息
    const extractedInfo = extractContactInfo(parseResult.content);
    
    // 优先使用表单数据，否则使用提取的信息
    const name = req.body.name || extractedInfo.name || originalFileName.replace(/\.(pdf|docx|doc)$/i, '');
    const email = req.body.email || extractedInfo.email || '';
    const phone = req.body.phone || extractedInfo.phone || '';

    // 获取用户ID
    const userId = Number((req as any).user?.id) || 1;

    // 插入数据库
    await db.insert(resumes).values({
      userId,
      name,
      email,
      phone,
      resumeFile: filePath,
      originalFileName,
      fileType,
      fileSize,
      parsedContent: parseResult.content,
      status: 'pending' // 初始化为待筛选状态
    });

    // 获取刚插入的记录（按创建时间排序取最新的）
    const [newResume] = await db.select().from(resumes)
      .orderBy(desc(resumes.id))
      .limit(1);

    res.json({
      code: 200,
      message: '简历上传成功',
      data: newResume
    });
  } catch (error: any) {
    console.error('上传简历失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '上传失败'
    });
  }
});

/**
 * 获取简历列表
 */
router.get('/resumes', async (req: Request, res: Response) => {
  try {
    const resumeList = await db.select().from(resumes).orderBy(desc(resumes.createdAt));
    
    res.json({
      code: 200,
      data: resumeList
    });
  } catch (error: any) {
    console.error('获取简历列表失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败'
    });
  }
});

/**
 * 获取简历详情
 */
router.get('/resume/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    
    if (!resume) {
      return res.status(404).json({
        code: 404,
        message: '简历不存在'
      });
    }

    res.json({
      code: 200,
      data: resume
    });
  } catch (error: any) {
    console.error('获取简历详情失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '获取失败'
    });
  }
});

/**
 * 删除简历
 */
router.delete('/resume/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    
    if (!resume) {
      return res.status(404).json({
        code: 404,
        message: '简历不存在'
      });
    }

    // 删除文件
    if (resume.resumeFile && fs.existsSync(resume.resumeFile)) {
      fs.unlinkSync(resume.resumeFile);
    }

    // 删除数据库记录
    await db.delete(resumes).where(eq(resumes.id, id));

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error: any) {
    console.error('删除简历失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '删除失败'
    });
  }
});

/**
 * 更新简历状态
 */
router.put('/resume/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;

    // 验证状态值
    const validStatuses: ResumeStatus[] = ['pending', 'rejected', 'passed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的状态值，应为 pending、rejected 或 passed'
      });
    }

    const [existingResume] = await db.select().from(resumes).where(eq(resumes.id, id));
    
    if (!existingResume) {
      return res.status(404).json({
        code: 404,
        message: '简历不存在'
      });
    }

    // 更新状态
    await db.update(resumes).set({ status }).where(eq(resumes.id, id));

    res.json({
      code: 200,
      message: '状态更新成功'
    });
  } catch (error: any) {
    console.error('更新简历状态失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '更新失败'
    });
  }
});

/**
 * 从邮箱导入简历
 */
router.post('/resume/import-from-email', authenticate, async (req: Request, res: Response) => {
  try {
    // 优先使用请求体中的 userId，否则使用 token 中的用户 ID
    const tokenUserId = (req as any).user.id;
    const { configId, userId, since, limit } = req.body;
    const effectiveUserId = userId || tokenUserId;

    if (!configId) {
      return res.status(400).json({
        code: 400,
        message: '请选择邮箱配置'
      });
    }

    console.log('开始从邮箱导入简历:', { configId, userId: effectiveUserId, since, limit });

    // 从邮箱获取邮件（包含简历附件）
    const emails = await fetchEmailsWithAttachments({
      configId,
      userId: effectiveUserId,
      since: since ? new Date(since) : undefined,
      limit: limit || 10,
    });

    if (emails.length === 0) {
      return res.json({
        code: 200,
        message: '未找到包含简历附件的邮件',
        data: { imported: 0, resumes: [] },
      });
    }

    const importedResumes: any[] = [];

    // 遍历每封邮件，保存附件为简历
    for (const email of emails) {
      for (const attachment of email.attachments) {
        try {
          // 保存附件到简历目录
          const { filePath, originalFileName } = saveAttachmentToResume(
            attachment.content,
            attachment.filename,
            effectiveUserId
          );

          const fileType = getFileType(originalFileName);
          const fileSize = attachment.content.length;

          // 解析文档内容
          const parseResult = await parseDocument(filePath, originalFileName);

          if (parseResult.error) {
            console.error('解析文档失败:', parseResult.error);
            continue;
          }

          // 从解析内容中提取联系信息
          const extractedInfo = extractContactInfo(parseResult.content);

          // 从邮件发件人提取邮箱
          const emailMatch = email.from.match(/<(.+)>/) || email.from.match(/([^\s]+@[^\s]+)/);
          const fromEmail = emailMatch ? emailMatch[1] : '';

          // 使用邮件主题作为简历名称（去掉 Re: , Fw: 等前缀）
          const name = email.subject
            .replace(/^(Re:|Fw:|转发:|回复:)\s*/i, '')
            .replace(/\.(pdf|docx?|doc)$/i, '')
            .trim() || originalFileName.replace(/\.(pdf|docx?|doc)$/i, '');

          // 插入数据库
          await db.insert(resumes).values({
            userId: effectiveUserId,
            name,
            email: fromEmail || extractedInfo.email || '',
            phone: extractedInfo.phone || '',
            resumeFile: filePath,
            originalFileName,
            fileType,
            fileSize,
            parsedContent: parseResult.content,
            status: 'pending',
          });

          // 获取刚插入的记录
          const [newResume] = await db.select().from(resumes)
            .orderBy(desc(resumes.id))
            .limit(1);

          importedResumes.push(newResume);
          console.log('成功导入简历:', originalFileName);
        } catch (saveErr) {
          console.error('保存简历失败:', saveErr);
        }
      }
    }

    res.json({
      code: 200,
      message: `成功导入 ${importedResumes.length} 份简历`,
      data: {
        imported: importedResumes.length,
        resumes: importedResumes,
      },
    });
  } catch (error: any) {
    console.error('从邮箱导入简历失败:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '导入失败'
    });
  }
});

export default router;
