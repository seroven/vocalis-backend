import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import {
  getLyricMarks,
  getTags,
  postLyricMark,
  postTag,
  putTag,
  removeLyricMark,
  removeTag,
} from './views/tag.view.js';

export const tagRoutes = Router();

tagRoutes.get('/tags', requireAuth, getTags);
tagRoutes.post('/tags', requireAuth, postTag);
tagRoutes.put('/tags/:id', requireAuth, putTag);
tagRoutes.delete('/tags/:id', requireAuth, removeTag);
tagRoutes.get('/tags/marks/:trackId', requireAuth, getLyricMarks);
tagRoutes.post('/tags/marks', requireAuth, postLyricMark);
tagRoutes.delete('/tags/marks/:id', requireAuth, removeLyricMark);
