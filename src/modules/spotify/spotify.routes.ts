import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { getAlbum, getArtist, getTrack } from './views/catalog.view.js';
import { searchSpotifyCatalog } from './views/search.view.js';

export const spotifyRoutes = Router();

spotifyRoutes.get('/spotify/search', requireAuth, searchSpotifyCatalog);
spotifyRoutes.get('/spotify/albums/:id', requireAuth, getAlbum);
spotifyRoutes.get('/spotify/artists/:id', requireAuth, getArtist);
spotifyRoutes.get('/spotify/tracks/:id', requireAuth, getTrack);
