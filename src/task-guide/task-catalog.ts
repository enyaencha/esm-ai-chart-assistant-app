import type { AssistantMessage } from '../api/types';
import { quickActionWorkflows } from './workflow-knowledge';

export interface TaskDefinition extends AssistantMessage {
  id: string;
  label: string;
  triggers: Array<string>;
}

export const tasks: Array<TaskDefinition> = quickActionWorkflows;
