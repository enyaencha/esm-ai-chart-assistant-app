# KenyaEMR AI Chart Assistant ESM

Reusable OpenMRS 3 ESM app for a read-only AI chart assistant and workflow guide.

## Architecture

This package is the frontend layer. It includes built-in workflow knowledge for common TaifaCare/OpenMRS workflows and read-only patient chart summaries. It can also call an AI orchestration service for future model-backed answers, retrieval, audit logging, permissions, and guarded tool execution.

```text
OpenMRS SPA
  -> @enyaencha/esm-ai-chart-assistant-app
  -> built-in workflow knowledge + read-only OpenMRS chart context
  -> optional AI orchestration service
  -> optional model provider / server-side retrieval / OpenMRS tools
```

The consuming OpenMRS config repo should only add this package to the frontend build and provide runtime config. It should not carry the workbook or generated knowledge artifacts.

## Configuration

Add this package to the frontend build config:

```json
{
  "frontendModules": {
    "@enyaencha/esm-ai-chart-assistant-app": "next"
  }
}
```

Add runtime config:

```json
{
  "@enyaencha/esm-ai-chart-assistant-app": {
    "enabled": true,
    "apiBaseUrl": "/openmrs/ws/rest/v1/kenyaemr-ai",
    "enablePatientChartAssistant": true,
    "enableTaskGuide": true,
    "enableSourceDisplay": true,
    "allowWriteActions": false,
    "enableQuestionLearning": true,
    "requestTimeoutMs": 8000,
    "maxRecentEncounters": 10,
    "maxRecentObs": 80
  }
}
```

`enableQuestionLearning` stores a browser-local question log under `kenyaemr-ai-question-learning-log` and emits a `kenyaemr-ai-question-recorded` browser event. It is intended to review what users ask and improve workflow coverage; it does not send the log anywhere by itself.

Use a same-origin reverse proxy for production:

```text
/openmrs/ws/rest/v1/kenyaemr-ai/api/ai/chat -> http://kenyaemr-ai-orchestration-service:8210/api/ai/chat
```

## Development

```sh
npm install --legacy-peer-deps
npm run typescript
npm run build
```

The package has been verified with:

```sh
npm run typescript
npm run build
npm pack --dry-run
```

## Publish

```sh
npm login
npm publish --access public --tag next
```

After validation, publish a stable release:

```sh
npm version patch
npm publish --access public --tag latest
```
