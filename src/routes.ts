import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes.js';

export const apiRouter = Router();

apiRouter.use(authRoutes);
