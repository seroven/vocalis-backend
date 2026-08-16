import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes.js';
import { spotifyRoutes } from './modules/spotify/spotify.routes.js';

export const apiRouter = Router();

apiRouter.use(authRoutes);
apiRouter.use(spotifyRoutes);
