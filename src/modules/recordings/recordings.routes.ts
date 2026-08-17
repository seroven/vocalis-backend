import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import multer from 'multer';
import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import {
  extensionFor,
  isAllowedAudio,
  MAX_BYTES,
  RECORDINGS_DIR,
} from './lib/storage.js';
import {
  getRecordingAudio,
  getRecordings,
  postRecording,
  putRecording,
  removeRecording,
} from './views/recording.view.js';

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, done) => {
      mkdirSync(RECORDINGS_DIR, { recursive: true });
      done(null, RECORDINGS_DIR);
    },
    filename: (req, file, done) => {
      const userId = req.authUser?.id ?? 'anon';
      done(null, `${userId}-${randomUUID()}${extensionFor(file.mimetype)}`);
    },
  }),
  limits: { fileSize: MAX_BYTES },
  fileFilter: (_req, file, done) => {
    if (isAllowedAudio(file.mimetype)) {
      done(null, true);
      return;
    }

    done(new Error('El archivo no es audio'));
  },
});

export const recordingRoutes = Router();

recordingRoutes.get('/recordings', requireAuth, getRecordings);
recordingRoutes.post('/recordings', requireAuth, upload.single('audio'), postRecording);
recordingRoutes.put('/recordings/:id', requireAuth, putRecording);
recordingRoutes.get('/recordings/:id/audio', requireAuth, getRecordingAudio);
recordingRoutes.delete('/recordings/:id', requireAuth, removeRecording);
