import path from 'node:path';
import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import {
  toRecordingItem,
  type RecordingTrackGroup,
} from '../interfaces/recording.interface.js';
import { removeRecordingFile } from '../lib/storage.js';
import {
  createRecording,
  deleteRecording,
  findRecording,
  listRecordings,
  updateRecordingTitle,
} from '../repositories/recording.repository.js';

const SPOTIFY_ID = /^[A-Za-z0-9]{10,30}$/;

function readId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function groupRecordings(
  records: Awaited<ReturnType<typeof listRecordings>>,
): RecordingTrackGroup[] {
  const groups = new Map<string, RecordingTrackGroup>();

  for (const record of records) {
    const current = groups.get(record.spotify_id);
    const item = toRecordingItem(record);

    if (current) {
      current.recordings.push(item);
      continue;
    }

    groups.set(record.spotify_id, {
      spotifyId: record.spotify_id,
      title: record.track_title,
      artistName: record.artist_name,
      imageUrl: record.image_url,
      recordings: [item],
    });
  }

  return [...groups.values()];
}

export async function getRecordings(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const trackId =
    typeof req.query.trackId === 'string' && SPOTIFY_ID.test(req.query.trackId)
      ? req.query.trackId
      : undefined;
  const records = await listRecordings(req.authUser.id, trackId);
  return sendSuccess(res, { items: groupRecordings(records) });
}

export async function postRecording(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const file = req.file;
  const spotifyId = typeof req.body?.spotifyId === 'string' ? req.body.spotifyId : '';
  const trackTitle = typeof req.body?.trackTitle === 'string' ? req.body.trackTitle.trim() : '';
  const artistName = typeof req.body?.artistName === 'string' ? req.body.artistName.trim() : '';
  const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
  const durationMs = Number(req.body?.durationMs);

  if (!file) {
    return sendError(res, 'Falta el audio de la grabación', 400);
  }

  if (
    !SPOTIFY_ID.test(spotifyId) ||
    !trackTitle ||
    !artistName ||
    !Number.isFinite(durationMs) ||
    durationMs < 400
  ) {
    await removeRecordingFile(file.path);
    return sendError(res, 'La grabación no es válida', 400);
  }

  const record = await createRecording(req.authUser.id, {
    spotifyId,
    trackTitle: trackTitle.slice(0, 255),
    artistName: artistName.slice(0, 255),
    imageUrl: imageUrl ? imageUrl.slice(0, 512) : null,
    durationMs: Math.round(durationMs),
    mimeType: file.mimetype.split(';')[0] ?? 'audio/webm',
    filePath: file.path,
  });

  if (!record) {
    await removeRecordingFile(file.path);
    return sendError(res, 'No se pudo guardar la grabación', 500);
  }

  return sendSuccess(res, toRecordingItem(record), 'Successful operation', 201);
}

export async function putRecording(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const id = readId(req.params.id);
  const raw = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!id || raw.length > 80) {
    return sendError(res, 'El título no es válido', 400);
  }

  const record = await updateRecordingTitle(req.authUser.id, id, raw || null);
  if (!record) {
    return sendError(res, 'No encontramos esa grabación', 404);
  }

  return sendSuccess(res, toRecordingItem(record));
}

export async function getRecordingAudio(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const id = readId(req.params.id);
  if (!id) {
    return sendError(res, 'La grabación no es válida', 400);
  }

  const record = await findRecording(req.authUser.id, id);
  if (!record) {
    return sendError(res, 'No encontramos esa grabación', 404);
  }

  res.setHeader('Content-Type', record.mime_type);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  return res.sendFile(path.resolve(record.file_path));
}

export async function removeRecording(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const id = readId(req.params.id);
  if (!id) {
    return sendError(res, 'La grabación no es válida', 400);
  }

  const record = await deleteRecording(req.authUser.id, id);
  if (!record) {
    return sendError(res, 'No encontramos esa grabación', 404);
  }

  await removeRecordingFile(record.file_path);
  return sendSuccess(res, { removed: true });
}
