// Re-export all template operations from the HTTP API layer
export {
  type ScreeningTemplate,
  loadTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  setDefaultTemplate,
} from "../../api/screeningTemplate";
