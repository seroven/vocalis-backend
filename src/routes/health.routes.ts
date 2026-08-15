import { Router } from 'express';
import { getExample, getHealth } from '../controllers/health.controller.js';

export const healthRouter = Router();

healthRouter.get('/health', getHealth);
healthRouter.get('/example', getExample);
