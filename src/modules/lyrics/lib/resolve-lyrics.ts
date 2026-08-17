import { findLyrics } from '../../spotify/services/lyrics.service.js';
import {
  findGlobalTrackLyrics,
  findUserTrackLyrics,
} from '../repositories/track-lyrics.repository.js';

export type LyricsSource = 'catalog' | 'global' | 'user' | null;

export async function resolveTrackLyrics(
  userId: number,
  spotifyId: string,
  artistName: string | null,
  title: string,
) {
  const catalog = artistName ? await findLyrics(artistName, title) : null;
  if (catalog) {
    return { lyrics: catalog, lyricsSource: 'catalog' as const };
  }

  const global = await findGlobalTrackLyrics(spotifyId);
  if (global) {
    return { lyrics: global, lyricsSource: 'global' as const };
  }

  const user = await findUserTrackLyrics(userId, spotifyId);
  if (user) {
    return { lyrics: user, lyricsSource: 'user' as const };
  }

  return { lyrics: null, lyricsSource: null };
}
