import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../../utils/responses.js';
import {
  isTagColor,
  isTagScope,
  isTagShape,
  toLyricTagMark,
  toTag,
  type TagPayload,
} from '../interfaces/tag.interface.js';
import {
  createLyricMark,
  createTag,
  deleteLyricMark,
  deleteTag,
  findTag,
  listLyricMarks,
  listTags,
  updateTag,
} from '../repositories/tag.repository.js';

const SPOTIFY_ID = /^[A-Za-z0-9]{10,30}$/;

function parsePayload(body: unknown): TagPayload | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const { color, shape, scope, targetId, targetName } = body as Record<string, unknown>;

  if (!name || name.length > 80 || !isTagColor(color) || !isTagShape(shape) || !isTagScope(scope)) {
    return null;
  }

  const target =
    typeof targetId === 'string' && SPOTIFY_ID.test(targetId) ? targetId : null;
  const label =
    typeof targetName === 'string' && targetName.trim()
      ? targetName.trim().slice(0, 255)
      : null;

  if (scope === 'general') {
    return { name: name.slice(0, 80), color, shape, scope, targetId: null, targetName: null };
  }

  if (!target) {
    return null;
  }

  return {
    name: name.slice(0, 80),
    color,
    shape,
    scope,
    targetId: target,
    targetName: label,
  };
}

function readId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getTags(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const scope = isTagScope(req.query.scope) ? req.query.scope : undefined;
  const targetId =
    typeof req.query.targetId === 'string' && SPOTIFY_ID.test(req.query.targetId)
      ? req.query.targetId
      : undefined;
  const tags = await listTags(req.authUser.id, { scope, targetId });
  return sendSuccess(res, { items: tags.map(toTag) });
}

export async function postTag(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const payload = parsePayload(req.body);
  if (!payload) {
    return sendError(res, 'La etiqueta no es válida', 400);
  }

  const tag = await createTag(req.authUser.id, payload);
  return sendSuccess(res, toTag(tag), 'Successful operation', 201);
}

export async function putTag(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const id = readId(req.params.id);
  const payload = parsePayload(req.body);
  if (!id || !payload) {
    return sendError(res, 'La etiqueta no es válida', 400);
  }

  const tag = await updateTag(req.authUser.id, id, payload);
  if (!tag) {
    return sendError(res, 'No encontramos esa etiqueta', 404);
  }

  return sendSuccess(res, toTag(tag));
}

export async function removeTag(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const id = readId(req.params.id);
  if (!id) {
    return sendError(res, 'La etiqueta no es válida', 400);
  }

  await deleteTag(req.authUser.id, id);
  return sendSuccess(res, { removed: true });
}

export async function getLyricMarks(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const spotifyId = typeof req.params.trackId === 'string' ? req.params.trackId : '';
  if (!SPOTIFY_ID.test(spotifyId)) {
    return sendError(res, 'La canción no es válida', 400);
  }

  const marks = await listLyricMarks(req.authUser.id, spotifyId);
  return sendSuccess(res, { items: marks.map(toLyricTagMark) });
}

export async function postLyricMark(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const tagId = Number(req.body?.tagId);
  const spotifyId = typeof req.body?.spotifyId === 'string' ? req.body.spotifyId : '';
  const lineIndex = Number(req.body?.lineIndex);
  const startOffset = Number(req.body?.startOffset);
  const endOffset = Number(req.body?.endOffset);
  const excerpt = typeof req.body?.excerpt === 'string' ? req.body.excerpt.trim() : '';

  if (
    !Number.isInteger(tagId) ||
    !SPOTIFY_ID.test(spotifyId) ||
    !Number.isInteger(lineIndex) ||
    lineIndex < 0 ||
    !Number.isInteger(startOffset) ||
    !Number.isInteger(endOffset) ||
    startOffset < 0 ||
    endOffset <= startOffset ||
    !excerpt
  ) {
    return sendError(res, 'La marca no es válida', 400);
  }

  const tag = await findTag(req.authUser.id, tagId);
  if (!tag) {
    return sendError(res, 'No encontramos esa etiqueta', 404);
  }

  const mark = await createLyricMark(req.authUser.id, {
    tagId,
    spotifyId,
    lineIndex,
    startOffset,
    endOffset,
    excerpt: excerpt.slice(0, 512),
  });

  if (!mark) {
    return sendError(res, 'No se pudo guardar la marca', 500);
  }

  return sendSuccess(res, toLyricTagMark(mark), 'Successful operation', 201);
}

export async function removeLyricMark(req: Request, res: Response) {
  if (!req.authUser) {
    return sendError(res, 'No hay una sesión activa', 401);
  }

  const id = readId(req.params.id);
  if (!id) {
    return sendError(res, 'La marca no es válida', 400);
  }

  await deleteLyricMark(req.authUser.id, id);
  return sendSuccess(res, { removed: true });
}
