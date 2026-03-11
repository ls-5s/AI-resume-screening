import { db } from '../../db/index';
import { aiConfigs } from '../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * 测试 AI 配置是否有效
 */
export async function testAiConfig(config: {
    model: string;
    apiUrl: string;
    apiKey: string;
    task?: string;
}): Promise<{ success: boolean; message: string }> {
    const { model, apiUrl, apiKey, task } = config;
    const url = apiUrl.replace(/\/$/, '');

    // 识别 API 类型
    const apiType = detectApiType(url);

    // 构建请求体
    const requestBody = buildRequestBody(apiType, model, task);

    try {
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        }, 10000);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})) as Record<string, any>;
            const message = parseApiError(response.status, errorData, apiType);
            return { success: false, message };
        }

        const data = await response.json() as Record<string, any>;
        const hasContent = (data.choices?.length > 0) || (data.output?.choices?.length > 0);

        return hasContent
            ? { success: true, message: 'AI 模型连接成功' }
            : { success: false, message: 'API 响应格式异常' };

    } catch (error) {
        return handleRequestError(error);
    }
}

/**
 * 识别 API 类型
 */
function detectApiType(url: string): 'aliyun-native' | 'aliyun-compatible' | 'other' {
    const isAliyun = url.includes('dashscope.aliyuncs.com');
    if (!isAliyun) return 'other';

    // 兼容模式 API (类似 OpenAI 格式)
    if (url.includes('/compatible-mode/')) {
        return 'aliyun-compatible';
    }
    // 原生 API
    return 'aliyun-native';
}

/**
 * 根据 API 类型构建请求体
 */
function buildRequestBody(apiType: string, model: string, task?: string): Record<string, unknown> {
    const basePayload = { model, max_tokens: 100 };

    switch (apiType) {
        case 'aliyun-native':
            // 阿里云原生 API，需要 task 参数
            return {
                ...basePayload,
                task: task || 'text-generation',
                input: {
                    messages: [{ role: 'user', content: 'Hi' }]
                },
                parameters: { result_format: 'message' },
            };
        case 'aliyun-compatible':
            // 阿里云兼容 API（类似 OpenAI 格式），使用顶层 messages
            const payload: Record<string, unknown> = {
                ...basePayload,
                messages: [{ role: 'user', content: 'Hi' }],
            };
            // 只有明确传入了 task 才添加
            if (task) {
                payload.task = task;
            }
            return payload;
        default:
            // OpenAI 兼容 API，不需要 task 参数
            return {
                ...basePayload,
                messages: [{ role: 'user', content: 'Hi' }],
            };
    }
}

/**
 * 带超时的 fetch 封装
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * 解析 API 错误响应
 */
function parseApiError(status: number, data: Record<string, unknown>, apiType: string): string {
    // 优先使用 API 返回的错误信息
    const errorObj = data.error as Record<string, unknown> | undefined;
    const apiMessage = (data.message as string)
        || (errorObj?.message as string)
        || (typeof data.detail === 'string' ? data.detail : undefined);

    if (apiMessage) return apiMessage;

    // HTTP 状态码错误
    const isAliyun = apiType !== 'other';

    const errorMessages: Record<number, string> = {
        400: isAliyun ? '请求参数错误，请检查模型名称和请求格式' : '请求参数错误',
        401: 'API Key 无效或过期',
        403: isAliyun ? 'API Key 无权限或免费额度耗尽' : '无权访问',
        404: isAliyun ? 'API 地址错误，请检查 URL' : '接口地址错误',
        429: '请求频率超限，请稍后再试',
        500: 'AI 服务端错误，请稍后再试',
        502: 'AI 服务端错误，请稍后再试',
        503: 'AI 服务端错误，请稍后再试',
    };

    return errorMessages[status] || `API 返回错误: ${status}`;
}

/**
 * 处理请求异常
 */
function handleRequestError(error: unknown): { success: boolean; message: string } {
    if (error instanceof Error) {
        if (error.name === 'AbortError') {
            return { success: false, message: '请求超时，请检查网络或 API 地址' };
        }
        return { success: false, message: `连接失败：${error.message}` };
    }
    return { success: false, message: '连接失败，请检查 API 地址和 Key' };
}
/**
 * 获取用户的 AI 配置列表
 */
export async function getAiConfigs(userId: number) {
  const configs = await db.select().from(aiConfigs).where(eq(aiConfigs.userId, userId));
  
  return configs;
}

/**
 * 获取单个 AI 配置
 */
export async function getAiConfigById(userId: number, configId: number) {
  const [config] = await db.select().from(aiConfigs).where(
    eq(aiConfigs.id, configId)
  );
  
  if (!config || config.userId !== userId) {
    return null;
  }
  
  return config;
}

/**
 * 获取默认 AI 配置（返回第一个或新建默认配置）
 */
export async function getAiConfig(userId: number) {
  const configs = await db.select().from(aiConfigs).where(eq(aiConfigs.userId, userId));
  
  if (configs.length === 0) {
    // 如果没有配置，返回默认配置
    return {
      id: null,
      userId,
      name: '默认配置',
      model: 'gpt-4o',
      apiUrl: 'https://api.openai.com/v1',
      apiKey: '',
      prompt: '你是一个专业的简历筛选助手。请根据以下简历内容，评估候选人是否符合岗位要求。\n\n岗位要求：\n{job_requirements}\n\n简历内容：\n{resume_content}\n\n请从以下几个方面进行评估：\n1. 教育背景\n2. 工作经历\n3. 技能匹配度\n4. 项目经验\n\n请给出评估结果和建议。',
      isDefault: true,
    };
  }
  
  // 返回默认配置，如果没有设置默认则返回第一个
  const defaultConfig = configs.find(c => c.isDefault);
  return defaultConfig || configs[0];
}

/**
 * 创建 AI 配置
 */
export async function createAiConfig(
  userId: number,
  data: {
    name?: string;
    model?: string;
    apiUrl?: string;
    apiKey?: string;
    prompt?: string;
    isDefault?: boolean;
  }
) {
  // 如果设置为默认配置，先取消其他默认配置
  if (data.isDefault === true) {
    await db.update(aiConfigs)
      .set({ isDefault: false })
      .where(eq(aiConfigs.userId, userId));
  }

  const [createdId] = await db
    .insert(aiConfigs)
    .values({
      userId,
      name: data.name || '新配置',
      model: data.model || 'gpt-4o',
      apiUrl: data.apiUrl || 'https://api.openai.com/v1',
      apiKey: data.apiKey || '',
      prompt: data.prompt || '',
      isDefault: data.isDefault || false,
    });

  // MySQL 不支持 returning，需要手动查询获取插入的记录
  const [created] = await db.select().from(aiConfigs).where(eq(aiConfigs.id, createdId.insertId));

  return created;
}

/**
 * 更新 AI 配置
 */
export async function updateAiConfig(
  userId: number,
  configId: number,
  data: {
    name?: string;
    model?: string;
    apiUrl?: string;
  }
) {
  // 验证配置属于该用户
  const [existing] = await db.select().from(aiConfigs).where(eq(aiConfigs.id, configId));
  
  if (!existing || existing.userId !== userId) {
    return null;
  }

  await db
    .update(aiConfigs)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.apiUrl !== undefined && { apiUrl: data.apiUrl }),
      updatedAt: new Date(),
    })
    .where(eq(aiConfigs.id, configId));

  // 手动查询返回更新后的记录
  const [updated] = await db.select().from(aiConfigs).where(eq(aiConfigs.id, configId));
  
  return updated;
}

/**
 * 更新 AI 配置（包括敏感信息）
 */
export async function updateAiConfigFull(
  userId: number,
  configId: number,
  data: {
    name?: string;
    model?: string;
    apiUrl?: string;
    apiKey?: string;
    prompt?: string;
    isDefault?: boolean;
  }
) {
  // 验证配置属于该用户
  const [existing] = await db.select().from(aiConfigs).where(eq(aiConfigs.id, configId));
  
  if (!existing || existing.userId !== userId) {
    return null;
  }

  // 如果设置为默认配置，先取消其他默认配置
  if (data.isDefault === true) {
    await db.update(aiConfigs)
      .set({ isDefault: false })
      .where(eq(aiConfigs.userId, userId));
  }

  await db
    .update(aiConfigs)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.apiUrl !== undefined && { apiUrl: data.apiUrl }),
      ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
      ...(data.prompt !== undefined && { prompt: data.prompt }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      updatedAt: new Date(),
    })
    .where(eq(aiConfigs.id, configId));

  // 手动查询返回更新后的记录
  const [updated] = await db.select().from(aiConfigs).where(eq(aiConfigs.id, configId));
  
  return updated;
}

/**
 * 删除 AI 配置
 */
export async function deleteAiConfig(userId: number, configId: number) {
  // 验证配置属于该用户
  const [existing] = await db.select().from(aiConfigs).where(eq(aiConfigs.id, configId));
  
  if (!existing || existing.userId !== userId) {
    return false;
  }
  
  await db.delete(aiConfigs).where(eq(aiConfigs.id, configId));
  
  return true;
}

/**
 * 使用 AI 筛选简历
 */
export async function screenResumeWithAi(
  userId: number,
  resumeId: number,
  jobRequirements: string,
  aiConfigId?: number
): Promise<{
  success: boolean;
  result?: {
    recommendation: 'pass' | 'reject' | 'pending';
    score: number;
    reasoning: string;
  };
  error?: string;
}> {
  // 获取 AI 配置
  let config: Awaited<ReturnType<typeof getAiConfig>> | Awaited<ReturnType<typeof getAiConfigById>>;
  
  if (aiConfigId) {
    config = await getAiConfigById(userId, aiConfigId);
    if (!config) {
      return { success: false, error: 'AI 配置不存在' };
    }
  } else {
    config = await getAiConfig(userId);
  }

  if (!config || !config.apiKey) {
    return { success: false, error: '请先配置 AI API Key' };
  }

  // 获取简历内容
  const { db } = await import('../../db/index.js');
  const { resumes } = await import('../../db/schema.js');
  const { eq } = await import('drizzle-orm');
  
  const [resume] = await db.select().from(resumes).where((eq as any)(resumes.id, resumeId));
  // console.log('resume', resume.parsedContent);
  if (!resume) {
    return { success: false, error: '简历不存在' };
  }


  
  // 关键：用反引号，且明确拼接“指令+简历内容”，无需多余拼接符
  const prompt = `根据提示词分析：${config.prompt}。简历内容：${resume.parsedContent}来筛选简历，请给出筛选结果和建议。`;
  console.log('config.prompt:', config.prompt);
  console.log('model:', config.model);
  // 调用 AI API
  const url = config.apiUrl.replace(/\/$/, '');
  const apiType = detectApiType(config.apiUrl);

  // 根据 API 类型构建请求体
  const requestBody = buildRequestBody(apiType, config.model, 'text-generation');
  //替换 messages 内容 为实际的 prompt
  if ('messages' in requestBody) {
    (requestBody as any).messages = [{ role: 'user', content: prompt }];
  } else if ('input' in requestBody) {
    (requestBody as any).input = { messages: [{ role: 'user', content: prompt }] };
  }

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    }, 600000);
 console.log('response:', response);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, any>;
      const message = parseApiError(response.status, errorData, apiType);
      return { success: false, error: message };
    }

    const data = await response.json() as Record<string, any>;
    
    // 根据 API 类型解析响应
    let aiResponse = '';
    if (apiType === 'aliyun-native') {
      // 阿里云原生 API 响应格式
      aiResponse = data.output?.choices?.[0]?.message?.content || '';
    } else {
      // OpenAI 兼容格式 (包括阿里云兼容模式)
      aiResponse = data.choices?.[0]?.message?.content || '';
    }

    // 解析 AI 响应，提取评估结果
    const result = parseAiResponse(aiResponse);
     console.log('result:', result);

    return {
      success: true,
      result,
    };
  } catch (error) {
    return handleRequestError(error);
  }
}

/**
 * 解析 AI 响应，提取评估结果
 */
function parseAiResponse(aiResponse: string): {
  recommendation: 'pass' | 'reject' | 'pending';
  score: number;
  reasoning: string;
} {
  const lowerResponse = aiResponse.toLowerCase();
  
  // 尝试识别推荐结果
  let recommendation: 'pass' | 'reject' | 'pending' = 'pending';
  if (lowerResponse.includes('推荐') || lowerResponse.includes('通过') || lowerResponse.includes('合适') || lowerResponse.includes('符合')) {
    recommendation = 'pass';
  } else if (lowerResponse.includes('不推荐') || lowerResponse.includes('拒绝') || lowerResponse.includes('不合适') || lowerResponse.includes('不符合')) {
    recommendation = 'reject';
  }

  // 尝试提取评分 (0-100)
  let score = 50; // 默认分数
  const scoreMatch = aiResponse.match(/(\d{1,3})\s*[分分]/);
  if (scoreMatch) {
    score = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
  }

  return {
    recommendation,
    score,
    reasoning: aiResponse,
  };
}

/**
 * 批量使用 AI 筛选简历
 */
export async function batchScreenResumesWithAi(
  userId: number,
  resumeIds: number[],
  jobRequirements: string,
  aiConfigId?: number
): Promise<{
  success: boolean;
  results?: Array<{
    resumeId: number;
    success: boolean;
    result?: {
      recommendation: 'pass' | 'reject' | 'pending';
      score: number;
      reasoning: string;
    };
    error?: string;
  }>;
  error?: string;
}> {
  const results = [];
  
  for (const resumeId of resumeIds) {
    const result = await screenResumeWithAi(userId, resumeId, jobRequirements, aiConfigId);
    results.push({
      resumeId,
      ...result,
    });
  }

  return {
    success: true,
    results,
  };
}