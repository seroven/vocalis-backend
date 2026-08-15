import { Router } from 'express';
import { healthRoutes } from './modules/health/health.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRoutes);
