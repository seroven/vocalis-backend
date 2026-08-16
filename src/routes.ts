import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes.js';
import { favoriteRoutes } from './modules/favorites/favorites.routes.js';
import { spotifyRoutes } from './modules/spotify/spotify.routes.js';

export const apiRouter = Router();

apiRouter.use(authRoutes);
apiRouter.use(favoriteRoutes);
apiRouter.use(spotifyRoutes);
