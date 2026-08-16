import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { getLyricSync, putLyricSync } from './views/lyrics-sync.view.js';

export const lyricRoutes = Router();

lyricRoutes.get('/lyrics/sync/:id', requireAuth, getLyricSync);
lyricRoutes.put('/lyrics/sync/:id', requireAuth, putLyricSync);
