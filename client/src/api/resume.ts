import instance from "../utils/http";
import type { Resume, UploadResumeParams } from "../types/resume";

/**
 * 从邮箱导入简历
 */
export interface ImportFromEmailParams {
  configId: number;
  since?: string; // ISO 日期字符串
  limit?: number;
}

export interface ImportFromEmailResult {
  imported: number;
  resumes: Resume[];
}

export const importResumesFromEmail = async (params: ImportFromEmailParams): Promise<ImportFromEmailResult> => {
  return instance.post('/v1/resume/import-from-email', params);
};

/**
 * 上传简历
 */
export const uploadResume = async (params: UploadResumeParams): Promise<Resume> => {
  const formData = new FormData();
  formData.append('file', params.file);
  if (params.name) formData.append('name', params.name);
  if (params.email) formData.append('email', params.email);
  if (params.phone) formData.append('phone', params.phone);

  return instance.post('/v1/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 获取简历列表
 */
export const getResumes = async (): Promise<Resume[]> => {
  return instance.get('/v1/resumes');
};

/**
 * 获取简历详情
 */
export const getResume = async (id: number): Promise<Resume> => {
  return instance.get(`/v1/resume/${id}`);
};

/**
 * 删除简历
 */
export const deleteResume = async (id: number): Promise<void> => {
  return instance.delete(`/v1/resume/${id}`);
};
