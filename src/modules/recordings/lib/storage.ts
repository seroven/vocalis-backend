import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';

export const RECORDINGS_DIR = path.resolve(process.cwd(), 'uploads', 'recordings');
const MAX_BYTES = 25 * 1024 * 1024;

export const ALLOWED_AUDIO = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/webm;codecs=opus',
]);

export function isAllowedAudio(mime: string) {
  if (ALLOWED_AUDIO.has(mime)) {
    return true;
  }

  return mime.startsWith('audio/');
}

export function extensionFor(mime: string) {
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) {
    return '.m4a';
  }
  if (mime.includes('mpeg') || mime.includes('mp3')) {
    return '.mp3';
  }
  if (mime.includes('ogg')) {
    return '.ogg';
  }
  if (mime.includes('wav')) {
    return '.wav';
  }
  return '.webm';
}

export async function ensureRecordingsDir() {
  await mkdir(RECORDINGS_DIR, { recursive: true });
}

export function resolveRecordingPath(filePath: string) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(RECORDINGS_DIR)) {
    throw new Error('Ruta de grabación no válida');
  }
  return resolved;
}

export async function removeRecordingFile(filePath: string) {
  try {
    await unlink(resolveRecordingPath(filePath));
  } catch {
    // El archivo puede haberse borrado ya.
  }
}

export { MAX_BYTES };
