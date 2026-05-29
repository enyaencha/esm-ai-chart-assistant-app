import type { AssistantMessage } from '../api/types';

const questionLogKey = 'kenyaemr-ai-question-learning-log';
const maxEntries = 250;

export interface QuestionLearningEntry {
  timestamp: string;
  route: string;
  locale: string;
  question: string;
  hasPatientContext: boolean;
  answerTitle?: string;
  answerMode?: string;
  answerSource: 'local-patient' | 'local-workflow' | 'orchestration' | 'fallback';
}

function readEntries(): Array<QuestionLearningEntry> {
  try {
    return JSON.parse(window.localStorage.getItem(questionLogKey) || '[]');
  } catch {
    return [];
  }
}

export function recordQuestionForLearning(
  enabled: boolean,
  question: string,
  locale: string,
  hasPatientContext: boolean,
  answer: AssistantMessage | null,
  answerSource: QuestionLearningEntry['answerSource'],
) {
  if (!enabled || !question.trim()) {
    return;
  }

  const entry: QuestionLearningEntry = {
    timestamp: new Date().toISOString(),
    route: window.location.pathname,
    locale,
    question: question.trim().slice(0, 500),
    hasPatientContext,
    answerTitle: answer?.title,
    answerMode: answer?.mode,
    answerSource,
  };
  const entries = readEntries().concat(entry).slice(-maxEntries);

  window.localStorage.setItem(questionLogKey, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent('kenyaemr-ai-question-recorded', { detail: entry }));
}

export function getQuestionLearningEntries() {
  return readEntries();
}
