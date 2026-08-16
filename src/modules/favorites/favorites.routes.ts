import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import {
  createFavorite,
  deleteFavorite,
  getFavorites,
} from './views/favorite.view.js';

export const favoriteRoutes = Router();

favoriteRoutes.get('/favorites', requireAuth, getFavorites);
favoriteRoutes.post('/favorites', requireAuth, createFavorite);
favoriteRoutes.delete('/favorites/:type/:id', requireAuth, deleteFavorite);
