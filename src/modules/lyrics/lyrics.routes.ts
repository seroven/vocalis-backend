import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { getFocusTracks, getLyricSync, putLyricSync } from './views/lyrics-sync.view.js';
import { putTrackLyrics } from './views/track-lyrics.view.js';

export const lyricRoutes = Router();

lyricRoutes.get('/lyrics/focus', requireAuth, getFocusTracks);
lyricRoutes.get('/lyrics/sync/:id', requireAuth, getLyricSync);
lyricRoutes.put('/lyrics/sync/:id', requireAuth, putLyricSync);
lyricRoutes.put('/lyrics/text/:id', requireAuth, putTrackLyrics);
