import { Router } from 'express';
import { getExample, getHealth } from './views/health.view.js';

export const healthRoutes = Router();

healthRoutes.get('/health', getHealth);
healthRoutes.get('/example', getExample);
