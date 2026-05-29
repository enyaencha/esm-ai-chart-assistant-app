import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConfig, useSession } from '@openmrs/esm-framework';
import { useTranslation } from 'react-i18next';
import { getAiHealth, postChat } from '../api/ai-client';
import type { AssistantMessage } from '../api/types';
import { recordQuestionForLearning } from '../analytics/question-learning';
import type { AiChartAssistantConfig } from '../config-schema';
import { getPatientContext, getPatientUuidFromPath } from '../patient-chart/chart-context';
import { answerPatientQuestion } from '../patient-chart/patient-summary';
import { tasks } from '../task-guide/task-catalog';
import { answerWorkflowQuestion } from '../task-guide/workflow-knowledge';
import styles from './ai-assistant.scss';

type ConnectionState = 'checking' | 'connected' | 'offline';

interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string | AssistantMessage;
}

const defaultConfig: AiChartAssistantConfig = {
  allowWriteActions: false,
  apiBaseUrl: '/openmrs/ws/rest/v1/kenyaemr-ai',
  enabled: true,
  enablePatientChartAssistant: true,
  enableQuestionLearning: true,
  enableSourceDisplay: true,
  enableTaskGuide: true,
  maxRecentEncounters: 10,
  maxRecentObs: 80,
  preferOrchestratorAnswers: true,
  requestTimeoutMs: 8000,
};

function getDisplayUser(session: unknown) {
  const data = session as {
    user?: {
      display?: string;
      username?: string;
      person?: {
        display?: string;
      };
    };
  };

  return data?.user?.person?.display || data?.user?.display || data?.user?.username || 'there';
}

function greetingForNow(user: string, t: (key: string, defaultValue: string, options?: Record<string, unknown>) => string) {
  const hour = new Date().getHours();

  if (hour < 12) {
    return t('goodMorning', 'Good morning, {{user}}', { user });
  }

  if (hour < 17) {
    return t('goodAfternoon', 'Good afternoon, {{user}}', { user });
  }

  return t('goodEvening', 'Good evening, {{user}}', { user });
}

function getConversationId() {
  const key = 'kenyaemr-ai-conversation-id';
  const existing = window.sessionStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const value =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `browser-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

function getLocale(language?: string) {
  const detectedLanguage =
    language || window.localStorage.getItem('i18nextLng') || navigator.language || document.documentElement.lang || 'en';
  return detectedLanguage.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function localTaskAnswer(
  message: string,
  t: (key: string, defaultValue: string, options?: Record<string, unknown>) => string,
): AssistantMessage {
  const workflowAnswer = answerWorkflowQuestion(message);

  if (workflowAnswer) {
    return workflowAnswer;
  }

  return {
    title: t('taskGuidance', 'Task guidance'),
    answer:
      t(
        'taskGuidanceAnswer',
        'I can help with clinical encounters, lab workflow, dispensing, registration, queueing, and patient chart summaries.',
      ),
    steps: [
      t('taskGuidanceStep1', 'Choose the workflow you want to complete.'),
      t('taskGuidanceStep2', 'Ask a direct question about the task.'),
      t('taskGuidanceStep3', 'Open a patient chart when the question needs patient-specific context.'),
    ],
    sources: [t('localTaskCatalogSource', 'Built-in workflow knowledge')],
  };
}

function isShortFollowUp(message: string) {
  const query = message.toLowerCase().replace(/\s+/g, ' ').trim();

  return (
    query.split(/\s+/).length <= 6 &&
    [
      'what next',
      'next',
      'where',
      'which form',
      'what form',
      'follow up',
      'follow-up',
      'history',
      'status',
      'eligible',
      'discontinue',
    ].some((term) => query.includes(term))
  );
}

function withPriorTaskContext(message: string, messages: Array<ConversationMessage>) {
  if (!isShortFollowUp(message)) {
    return message;
  }

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((item) => item.role === 'assistant' && typeof item.content !== 'string')?.content as AssistantMessage | undefined;
  const priorText = [lastAssistantMessage?.title, lastAssistantMessage?.answer].filter(Boolean).join(' ');

  if (!/\b(enroll|enrol|enrollment|enrolment|program|care panel)\b/i.test(priorText)) {
    return message;
  }

  return `${message} ${priorText}`;
}

function MessageCard({
  message,
  onSuggestion,
  suggestionLabel = 'Next',
  showSources,
}: {
  message: AssistantMessage;
  onSuggestion?: (suggestion: string) => void;
  suggestionLabel?: string;
  showSources: boolean;
}) {
  return (
    <article className={styles.aiAssistantMessage} data-role="assistant">
      <h4>{message.title}</h4>
      <p>{message.answer}</p>
      {message.steps?.length ? (
        <ol>
          {message.steps.map((step, index) => (
            <li key={`${step}-${index}`}>{step}</li>
          ))}
        </ol>
      ) : null}
      {message.sections?.map((section) => (
        <section className={styles.aiAssistantSection} key={section.title}>
          <h5>{section.title}</h5>
          <ul>
            {section.items.map((item, index) => (
              <li key={`${section.title}-${item}-${index}`}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
      {message.suggestions?.length ? (
        <div className={styles.aiAssistantSuggestions}>
          <span>{suggestionLabel}</span>
          {message.suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => onSuggestion?.(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      {showSources && message.sources?.length ? (
        <div className={styles.aiAssistantSources}>
          <span>Sources</span>
          {message.sources.map((source) => (
            <small key={source}>{source}</small>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function UserMessage({ message }: { message: string }) {
  return (
    <article className={styles.aiAssistantUserMessage} data-role="user">
      {message}
    </article>
  );
}

export default function AiAssistant() {
  const { i18n, t } = useTranslation();
  const config = {
    ...defaultConfig,
    ...useConfig<Partial<AiChartAssistantConfig>>(),
  };
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('checking');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Array<ConversationMessage>>([]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  const greeting = useMemo(() => greetingForNow(getDisplayUser(session), t), [session, t]);
  const patientUuid = config.enablePatientChartAssistant ? getPatientUuidFromPath() : null;

  useEffect(() => {
    if (!config.enabled) {
      return;
    }

    const abortController = new AbortController();
    getAiHealth(config.apiBaseUrl, abortController.signal)
      .then(() => setConnectionState('connected'))
      .catch(() => setConnectionState('offline'));

    return () => abortController.abort();
  }, [config.apiBaseUrl, config.enabled]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, busy]);

  const submitQuestion = useCallback(
    async (message: string) => {
      const trimmed = message.trim();

      if (!trimmed || busy) {
        return;
      }

      setInput('');
      setBusy(true);
      setMessages((current) => current.concat({ role: 'user', content: trimmed }));

      const taskQuestion = withPriorTaskContext(trimmed, messages);
      const abortController = new AbortController();
      const timeout = window.setTimeout(() => abortController.abort(), config.requestTimeoutMs);
      let patientContext = null;

      try {
        patientContext = patientUuid ? await getPatientContext(patientUuid, config) : null;
        if (connectionState === 'offline' || !config.preferOrchestratorAnswers) {
          throw new Error('Using local fallback while AI service is offline');
        }

        const response = await postChat(
          config.apiBaseUrl,
          {
            conversationId: getConversationId(),
            locale: getLocale(i18n.language),
            message: taskQuestion,
            patientContext,
            patientUuid,
            route: window.location.pathname,
            userContext: session,
          },
          abortController.signal,
        );

        setConnectionState('connected');
        recordQuestionForLearning(
          config.enableQuestionLearning,
          trimmed,
          getLocale(i18n.language),
          Boolean(patientContext),
          response.message,
          'orchestration',
        );
        setMessages((current) => current.concat({ role: 'assistant', content: response.message }));
      } catch (error) {
        const patientAnswer = answerPatientQuestion(trimmed, patientContext, getLocale(i18n.language));
        const workflowAnswer = answerWorkflowQuestion(taskQuestion);
        const answer = patientAnswer || workflowAnswer || localTaskAnswer(trimmed, t);

        setConnectionState('offline');
        recordQuestionForLearning(
          config.enableQuestionLearning,
          trimmed,
          getLocale(i18n.language),
          Boolean(patientContext),
          answer,
          patientAnswer ? 'local-patient' : workflowAnswer ? 'local-workflow' : 'fallback',
        );
        setMessages((current) => current.concat({ role: 'assistant', content: answer }));
      } finally {
        window.clearTimeout(timeout);
        setBusy(false);
      }
    },
    [busy, config, connectionState, i18n.language, messages, patientUuid, session, t],
  );

  if (!config.enabled) {
    return null;
  }

  return (
    <>
      <button
        className={styles.aiAssistantTopNavButton}
        data-ai-chart-assistant
        type="button"
        aria-expanded={open}
        title={open ? t('minimizeAiAssistant', 'Minimize AI Assistant') : t('aiAssistant', 'AI Assistant')}
        onClick={() => setOpen((current) => !current)}>
        {t('topNavButton', 'AI')}
      </button>
      {!open ? (
        <button
          className={styles.aiAssistantFloatingButton}
          data-ai-chart-assistant
          type="button"
          aria-label={t('aiAssistant', 'AI Assistant')}
          onClick={() => setOpen(true)}>
          {t('topNavButton', 'AI')}
        </button>
      ) : null}
      <aside className={styles.aiAssistantPanel} data-ai-chart-assistant data-open={open}>
        <header className={styles.aiAssistantHeader}>
          <div>
            <strong>{t('aiAssistant', 'AI Assistant')}</strong>
            <span>
              {t('subtitle', 'Tasks and chart guidance')} ·{' '}
              <b data-state={connectionState}>
                {connectionState === 'connected'
                  ? t('connected', 'Connected')
                  : connectionState === 'offline'
                    ? t('offlineFallback', 'Offline fallback')
                    : t('checking', 'Checking')}
              </b>
            </span>
          </div>
          <button type="button" aria-label={t('closeAiAssistant', 'Close AI Assistant')} onClick={() => setOpen(false)}>
            x
          </button>
        </header>
        {config.enableTaskGuide ? (
          <nav className={styles.aiAssistantChips} aria-label="AI assistant quick actions">
            {tasks.map((task) => (
              <button key={task.id} type="button" onClick={() => submitQuestion(task.label)}>
                {task.label}
              </button>
            ))}
            {patientUuid ? (
              <button type="button" onClick={() => submitQuestion(t('patientSummaryQuickAction', 'Patient summary'))}>
                {t('patientSummaryQuickAction', 'Patient summary')}
              </button>
            ) : null}
          </nav>
        ) : null}
        <main className={styles.aiAssistantMessages}>
          <MessageCard
            message={{
              title: greeting,
              answer: t('welcomeAnswer', 'Ask about a workflow or open a patient chart and ask for a summary.'),
              steps: [
                t('welcomeStep1', 'Select a quick action or type a question.'),
                t('welcomeStep2', 'Workflow questions are answered from built-in knowledge first.'),
                t('welcomeStep3', 'Patient-specific answers use the current OpenMRS session and are read-only.'),
              ],
              sources: [t('aiSource', 'AI orchestration service'), t('openmrsRestSource', 'OpenMRS REST when on a patient chart')],
            }}
            suggestionLabel={t('nextSuggestions', 'Next')}
            showSources={config.enableSourceDisplay}
          />
          {messages.map((item, index) =>
            item.role === 'user' ? (
              <UserMessage key={`message-${index}`} message={item.content as string} />
            ) : (
              <MessageCard
                key={`message-${index}`}
                message={item.content as AssistantMessage}
                onSuggestion={submitQuestion}
                suggestionLabel={t('nextSuggestions', 'Next')}
                showSources={config.enableSourceDisplay}
              />
            ),
          )}
          {busy ? <div className={styles.aiAssistantThinking}>{t('working', 'Working...')}</div> : null}
          <div ref={messageEndRef} />
        </main>
        <form
          className={styles.aiAssistantComposer}
          onSubmit={(event) => {
            event.preventDefault();
            submitQuestion(input);
          }}>
          <textarea
            aria-label="Ask a task or chart question"
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('askPlaceholder', 'Ask a task or chart question')}
            rows={1}
            value={input}
          />
          <button disabled={busy || !input.trim()} type="submit">
            {t('send', 'Send')}
          </button>
        </form>
      </aside>
    </>
  );
}
