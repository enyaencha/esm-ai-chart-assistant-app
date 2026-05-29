import { defineConfigSchema, getAsyncLifecycle } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';

const moduleName = '@enyaencha/esm-ai-chart-assistant-app';

const options = {
  featureName: 'ai-chart-assistant',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export const aiAssistant = getAsyncLifecycle(() => import('./chat/ai-assistant.component'), options);

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}
