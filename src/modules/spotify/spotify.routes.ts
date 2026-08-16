import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { searchSpotifyCatalog } from './views/search.view.js';

export const spotifyRoutes = Router();

spotifyRoutes.get('/spotify/search', requireAuth, searchSpotifyCatalog);
