export interface AiConfig {
  id: number | null;
  userId: number;
  name: string;
  model: string;
  apiUrl: string;
  apiKey: string;
  prompt: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateAiConfigData {
  name?: string;
  model?: string;
  apiUrl?: string;
  apiKey?: string;
  prompt?: string;
  isDefault?: boolean;
}

export interface CreateAiConfigData {
  name: string;
  model?: string;
  apiUrl?: string;
  apiKey?: string;
  prompt?: string;
  isDefault?: boolean;
}

export interface AiScreeningResult {
  recommendation: 'pass' | 'reject' | 'pending';
  score: number;
  reasoning: string;
}

export interface BatchScreenResult {
  resumeId: number;
  success: boolean;
  result?: AiScreeningResult;
  error?: string;
}