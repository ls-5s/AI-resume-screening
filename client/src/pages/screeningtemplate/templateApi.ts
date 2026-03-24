import type { PreFilterConfig } from "../../components/aiscreening/preFilterUtils";

export type ScreeningTemplate = {
  id: string;
  name: string;
  config: PreFilterConfig;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "ai-screening-templates";

function generateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadTemplates(): ScreeningTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTemplates(templates: ScreeningTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function createTemplate(
  name: string,
  config: PreFilterConfig,
): ScreeningTemplate {
  const templates = loadTemplates();
  const now = new Date().toISOString();
  const newTemplate: ScreeningTemplate = {
    id: generateId(),
    name,
    config,
    isDefault: templates.length === 0,
    createdAt: now,
    updatedAt: now,
  };
  saveTemplates([...templates, newTemplate]);
  return newTemplate;
}

export function updateTemplate(
  id: string,
  patch: Partial<Pick<ScreeningTemplate, "name" | "config">>,
): ScreeningTemplate | null {
  const templates = loadTemplates();
  const idx = templates.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  templates[idx] = {
    ...templates[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  saveTemplates(templates);
  return templates[idx];
}

export function deleteTemplate(id: string): boolean {
  const templates = loadTemplates();
  const next = templates.filter((t) => t.id !== id);
  if (next.length === templates.length) return false;
  // 如果删的是默认，且还有剩余，自动提升第一个为默认
  const deleted = templates.find((t) => t.id === id);
  if (deleted?.isDefault && next.length > 0) {
    next[0].isDefault = true;
  }
  saveTemplates(next);
  return true;
}

export function setDefaultTemplate(id: string): void {
  const templates = loadTemplates();
  const target = templates.find((t) => t.id === id);
  if (!target) return;
  templates.forEach((t) => {
    t.isDefault = t.id === id;
  });
  saveTemplates(templates);
}

export function duplicateTemplate(
  id: string,
  newName: string,
): ScreeningTemplate | null {
  const templates = loadTemplates();
  const source = templates.find((t) => t.id === id);
  if (!source) return null;
  const now = new Date().toISOString();
  const dup: ScreeningTemplate = {
    id: generateId(),
    name: newName,
    config: { ...source.config },
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  saveTemplates([...templates, dup]);
  return dup;
}
