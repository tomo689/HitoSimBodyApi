import { randomUUID } from 'node:crypto';

export interface CounselorSession {
  id: string;
  createdAt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}

const sessions = new Map<string, CounselorSession>();

export function createCounselorSession(): CounselorSession {
  const session: CounselorSession = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    messages: [],
  };
  sessions.set(session.id, session);
  return session;
}

export function getCounselorSession(id: string): CounselorSession | undefined {
  return sessions.get(id);
}

export function updateCounselorSession(
  id: string,
  messages: CounselorSession['messages'],
): CounselorSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.messages = messages;
  return session;
}
