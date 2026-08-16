import type { AuthUser } from '../modules/auth/interfaces/user.interface.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export {};
