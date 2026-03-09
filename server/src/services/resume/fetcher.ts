// 使用 require 进行手动导入
const Imap = require('imap');
import { simpleParser } from 'mailparser';
import path from 'path';
import fs from 'fs';
import { db } from '../../db/index.js';
import { emailConfigs } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export interface EmailMessage {
  from: string;
  subject: string;
  date: Date;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export interface FetchEmailOptions {
  configId: number;
  userId: number;
  since?: Date; // 获取指定日期之后的邮件
  limit?: number; // 限制获取的邮件数量
}

/**
 * 获取邮箱配置
 */
async function getEmailConfig(userId: number, configId: number) {
  const [config] = await db
    .select()
    .from(emailConfigs)
    .where(eq(emailConfigs.id, configId));

  if (!config) {
    throw new Error('邮箱配置不存在');
  }

  if (config.userId !== userId) {
    throw new Error('无权访问此邮箱配置');
  }

  return config;
}

/**
 * 连接到 IMAP 服务器
 */
function connectToImap(config: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const imapConfig = {
      user: config.email,
      password: config.authCode,
      host: config.imapHost || 'imap.qq.com',
      port: config.imapPort || 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
      },
    };

    // 打印 IMAP 配置信息
    console.log('===== IMAP 连接配置 =====');
    console.log('用户:', imapConfig.user);
    console.log('主机:', imapConfig.host);
    console.log('端口:', imapConfig.port);
    console.log('TLS:', imapConfig.tls);
    console.log('TLS Options:', imapConfig.password);
    console.log('=========================');

    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      resolve(imap);
    });

    imap.once('error', (err: Error) => {
      reject(err);
    });

    imap.connect();
  });
}

/**
 * 从邮箱获取邮件（包含简历附件）
 */
export async function fetchEmailsWithAttachments(
  options: FetchEmailOptions
): Promise<EmailMessage[]> {
  const { configId, userId, since, limit = 10 } = options;

  // 获取邮箱配置
  const config = await getEmailConfig(userId, configId);

  // 连接到 IMAP
  const imap = await connectToImap(config);
  console.log('IMAP 连接成功！');

  // 获取所有邮箱文件夹
  console.log('===== 获取邮箱文件夹列表 =====');
  const mailboxes = await new Promise<any>((resolve, reject) => {
    imap.getBoxes('', (err: Error | null, boxes: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(boxes);
      }
    });
  });

  // 递归打印所有邮箱名字
  function printMailboxes(boxes: any, prefix = '') {
    for (const [name, box] of Object.entries(boxes)) {
      const fullPath = prefix ? `${prefix}/${name}` : name;
      console.log(fullPath);
      if ((box as any).children) {
        printMailboxes((box as any).children, fullPath);
      }
    }
  }
  printMailboxes(mailboxes);
  console.log('===============================');

  try {
    return await new Promise((resolve, reject) => {
      // 打开收件箱
      imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // 构建搜索条件
        const searchCriteria: any[] = ['ALL', ['SINCE', since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]]; // 默认获取最近7天的邮件
        
        // 搜索邮件
        imap.search(searchCriteria, async (err, results) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          if (results.length === 0) {
            imap.end();
            return resolve([]);
          }

          // 只获取最新的 N 封邮件
          const messagesToFetch = results.slice(-limit);

          const fetch = imap.fetch(messagesToFetch, {
            bodies: '',
            struct: true,
            markSeen: false,
          });

          const emails: EmailMessage[] = [];
          const allEmails: Array<{
            from: string;
            subject: string;
            date: Date;
            hasResume: boolean;
            attachments: string[];
          }> = [];

          fetch.on('message', (msg) => {
            let emailData: EmailMessage | null = null;

            msg.on('body', async (stream) => {
              try {
                const parsed = await simpleParser(stream);
                
                // 查找附件
                const attachments: EmailMessage['attachments'] = [];
                
                if (parsed.attachments && parsed.attachments.length > 0) {
                  for (const attachment of parsed.attachments) {
                    // 只处理 PDF 和 Word 文档
                    const contentType = attachment.contentType?.toLowerCase() || '';
                    if (
                      contentType.includes('pdf') ||
                      contentType.includes('word') ||
                      contentType.includes('document') ||
                      attachment.filename?.match(/\.(pdf|docx?|doc)$/i)
                    ) {
                      // 获取附件内容
                      const content = (attachment as any).content;
                      if (content) {
                        attachments.push({
                          filename: attachment.filename || 'unknown',
                          content: Buffer.from(content),
                          contentType: contentType,
                        });
                      }
                    }
                  }
                }

                // 记录所有邮件的基本信息
                const emailInfo = {
                  from: parsed.from?.text || parsed.from?.address || '未知',
                  subject: parsed.subject || '无主题',
                  date: parsed.date || new Date(),
                  hasResume: attachments.length > 0,
                  attachments: attachments.map(a => a.filename),
                };
                allEmails.push(emailInfo);

                // 只返回包含简历附件的邮件
                if (attachments.length > 0) {
                  // 打印邮件列表信息
                  console.log('===== 邮件信息 =====');
                  console.log('发件人:', emailInfo.from);
                  console.log('主题:', emailInfo.subject);
                  console.log('日期:', emailInfo.date.toLocaleString());
                  console.log('附件数量:', attachments.length);
                  attachments.forEach((att, idx) => {
                    console.log(`  附件${idx + 1}: ${att.filename} (${att.contentType})`);
                  });
                  console.log('====================');
                  
                  emailData = {
                    from: emailInfo.from,
                    subject: emailInfo.subject,
                    date: emailInfo.date,
                    attachments,
                  };
                  emails.push(emailData);
                }
              } catch (parseErr) {
                console.error('解析邮件失败:', parseErr);
              }
            });

            msg.once('error', (msgErr) => {
              console.error('处理邮件消息失败:', msgErr);
            });
          });

          fetch.once('error', (fetchErr) => {
            imap.end();
            reject(fetchErr);
          });

          fetch.once('end', () => {
            // 打印所有邮件列表汇总
            console.log('\n========== 邮件列表汇总 ==========');
            console.log(`共搜索到 ${allEmails.length} 封邮件，其中 ${emails.length} 封包含简历附件\n`);
            
            // 打印所有邮件列表
            allEmails.forEach((email, idx) => {
              const resumeTag = email.hasResume ? '📎 有简历' : '  无简历';
              console.log(`[${idx + 1}] 发件人: ${email.from}`);
              console.log(`    主题: ${email.subject}`);
              console.log(`    日期: ${email.date.toLocaleString()}`);
              console.log(`    状态: ${resumeTag}`);
              if (email.attachments.length > 0) {
                console.log(`    附件: ${email.attachments.join(', ')}`);
              }
              console.log('----------------------------------------');
            });
            
            console.log('=======================================\n');
            
            // 单独打印包含简历的邮件列表（原有功能）
            if (emails.length > 0) {
              console.log('\n========== 简历附件列表 ==========');
              emails.forEach((email, idx) => {
                console.log(`[${idx + 1}] 发件人: ${email.from}`);
                console.log(`    主题: ${email.subject}`);
                console.log(`    日期: ${email.date.toLocaleString()}`);
                console.log(`    附件: ${email.attachments.map(a => a.filename).join(', ')}`);
                console.log('----------------------------------------');
              });
              console.log('=======================================\n');
            }
            
            imap.end();
            resolve(emails);
          });
        });
      });
    });
  } catch (error) {
    console.log('IMAP 连接失败:', error);
    if (imap) {
      imap.end();
    }
    throw error;
  }
}

/**
 * 保存邮件附件到简历目录
 */
export function saveAttachmentToResume(
  content: Buffer,
  filename: string,
  userId: number
): { filePath: string; originalFileName: string } {
  // 创建上传目录（如果不存在）
  const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // 生成唯一文件名
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext);
  const timestamp = Date.now();
  const uniqueFilename = `${baseName}_${timestamp}${ext}`;
  const filePath = path.join(uploadDir, uniqueFilename);

  // 写入文件
  fs.writeFileSync(filePath, content);

  return {
    filePath,
    originalFileName: filename,
  };
}

/**
 * 测试 IMAP 连接
 */
export async function testImapConnection(configId: number, userId: number): Promise<boolean> {
  const config = await getEmailConfig(userId, configId);
  
  try {
    const imap = await connectToImap(config);
    return new Promise((resolve) => {
      imap.once('ready', () => {
        imap.end();
        resolve(true);
      });
      imap.once('error', () => {
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}
