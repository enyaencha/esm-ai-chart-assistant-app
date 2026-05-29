import { Type } from '@openmrs/esm-framework';

export interface AiChartAssistantConfig {
  enabled: boolean;
  apiBaseUrl: string;
  enablePatientChartAssistant: boolean;
  enableTaskGuide: boolean;
  enableSourceDisplay: boolean;
  preferOrchestratorAnswers: boolean;
  allowWriteActions: boolean;
  enableQuestionLearning: boolean;
  requestTimeoutMs: number;
  maxRecentEncounters: number;
  maxRecentObs: number;
}

export const configSchema = {
  enabled: {
    _type: Type.Boolean,
    _default: true,
    _description: 'Whether the AI chart assistant is enabled.',
  },
  apiBaseUrl: {
    _type: Type.String,
    _default: '/openmrs/ws/rest/v1/kenyaemr-ai',
    _description: 'Base URL for the AI orchestration service. Use a same-origin reverse proxy in production.',
  },
  enablePatientChartAssistant: {
    _type: Type.Boolean,
    _default: true,
    _description: 'Enable patient-chart-aware questions and summaries.',
  },
  enableTaskGuide: {
    _type: Type.Boolean,
    _default: true,
    _description: 'Enable workflow task guidance.',
  },
  enableSourceDisplay: {
    _type: Type.Boolean,
    _default: true,
    _description: 'Show answer source labels returned by the orchestration service.',
  },
  preferOrchestratorAnswers: {
    _type: Type.Boolean,
    _default: true,
    _description: 'Use the AI orchestration service first when it is connected, with local knowledge as fallback.',
  },
  allowWriteActions: {
    _type: Type.Boolean,
    _default: false,
    _description: 'Allow write-action workflows. The first release should keep this false.',
  },
  enableQuestionLearning: {
    _type: Type.Boolean,
    _default: true,
    _description: 'Store a local, browser-only question log to help improve assistant workflow coverage.',
  },
  requestTimeoutMs: {
    _type: Type.Number,
    _default: 8000,
    _description: 'Timeout in milliseconds for AI orchestration service calls.',
  },
  maxRecentEncounters: {
    _type: Type.Number,
    _default: 10,
    _description: 'Maximum recent encounters to collect for patient chart context.',
  },
  maxRecentObs: {
    _type: Type.Number,
    _default: 80,
    _description: 'Maximum recent observations to collect for patient chart context.',
  },
};
