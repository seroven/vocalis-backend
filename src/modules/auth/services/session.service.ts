import { randomBytes } from 'node:crypto';
import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import type { AuthUser } from '../interfaces/user.interface.js';

const COOKIE_NAME = 'vocalis_session';
const STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_DAYS = 7;

type PendingState = {
  expiresAt: number;
  consumed: boolean;
};

const pendingStates = new Map<string, PendingState>();

export function createOAuthState() {
  const state = randomBytes(16).toString('hex');
  pendingStates.set(state, {
    expiresAt: Date.now() + STATE_TTL_MS,
    consumed: false,
  });
  return state;
}

export function consumeOAuthState(state: string) {
  const entry = pendingStates.get(state);

  if (!entry || entry.expiresAt <= Date.now()) {
    pendingStates.delete(state);
    return false;
  }

  if (entry.consumed) {
    return false;
  }

  entry.consumed = true;
  return true;
}

export function createSessionToken(user: AuthUser) {
  return jwt.sign(user, env.sessionSecret, {
    expiresIn: `${SESSION_DAYS}d`,
  });
}

export function readSessionToken(token: string): AuthUser {
  const payload = jwt.verify(token, env.sessionSecret);

  if (
    typeof payload !== 'object' ||
    typeof payload.id !== 'number' ||
    typeof payload.spotifyId !== 'string'
  ) {
    throw new Error('Sesión inválida');
  }

  return {
    id: payload.id,
    spotifyId: payload.spotifyId,
  };
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    path: '/',
  });
}

export { COOKIE_NAME };
