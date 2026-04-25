import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  role: string;
  preferredLanguage?: 'en' | 'sw';
  sessionId?: string;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

export type AuthenticatedRequestUser = AuthenticatedUser;
