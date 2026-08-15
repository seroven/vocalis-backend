import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import {
  completeSpotifyLogin,
  getCurrentUser,
  logout,
  startSpotifyLogin,
} from './views/auth.view.js';

export const authRoutes = Router();

authRoutes.get('/auth/spotify', startSpotifyLogin);
authRoutes.post('/auth/spotify/callback', completeSpotifyLogin);
authRoutes.get('/auth/me', requireAuth, getCurrentUser);
authRoutes.post('/auth/logout', logout);
