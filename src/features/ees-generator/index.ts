export {
  EESGeneratorWorkflow,
  EESGeneratorWorkflow as EESGeneratorPage,
} from "./components/EESGeneratorWorkflow";
export { TemplateRenderer } from "./components/TemplateRenderer";
export { StepIndicator } from "./components/WorkflowNavigation";
export { useEESTemplate } from "./hooks/useEESTemplate";
export {
  eesTemplateRegistry,
  getEESTemplateById,
  resolveEESTemplate,
} from "./services/template-registry";
export type {
  EESDomainData,
  EESOperator,
  EESTemplateDefinition,
  EESTemplateId,
} from "./types";
