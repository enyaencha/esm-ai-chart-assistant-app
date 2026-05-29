import type { ChatRequest, ChatResponse } from './types';

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export async function getAiHealth(apiBaseUrl: string, signal?: AbortSignal) {
  const response = await fetch(joinUrl(apiBaseUrl, '/api/ai/health'), {
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    throw new Error(`AI service returned ${response.status}`);
  }

  return response.json();
}

export async function postChat(apiBaseUrl: string, payload: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
  const response = await fetch(joinUrl(apiBaseUrl, '/api/ai/chat'), {
    body: JSON.stringify(payload),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal,
  });

  if (!response.ok) {
    throw new Error(`AI service returned ${response.status}`);
  }

  return response.json();
}
