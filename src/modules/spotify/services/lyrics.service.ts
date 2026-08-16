import type { LrclibHit } from '../interfaces/lyrics.interface.js';

function cleanLyrics(text: string) {
  return text.replace(/\r\n/g, '\n').trim();
}

export async function findLyrics(artistName: string, title: string) {
  const url = new URL('https://lrclib.net/api/search');
  url.searchParams.set('artist_name', artistName);
  url.searchParams.set('track_name', title);

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Vocalis (vocal practice app)',
    },
  });

  if (!response.ok) {
    return null;
  }

  const hits = (await response.json()) as LrclibHit[];
  const match = hits.find((hit) => hit.plainLyrics && !hit.instrumental);

  if (!match?.plainLyrics) {
    return null;
  }

  return cleanLyrics(match.plainLyrics);
}
