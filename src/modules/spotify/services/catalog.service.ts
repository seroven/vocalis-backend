import {
  artistNames,
  pickImage,
  searchCatalog,
  SpotifyUnauthorizedError,
  spotifyFetch,
} from '../../auth/services/spotify.service.js';
import type {
  AlbumDetail,
  ArtistDetail,
  CatalogItem,
  TrackDetail,
} from '../interfaces/catalog.interface.js';
import type {
  SpotifyAlbum,
  SpotifyAlbumTracks,
  SpotifyArtist,
  SpotifyArtistAlbums,
  SpotifyArtistRef,
  SpotifyImage,
  SpotifyTrack,
} from '../interfaces/spotify-api.interface.js';

const PAGE_LIMIT = 10;

function toTrackItem(
  track: { id: string; name: string; artists: SpotifyArtistRef[] },
  imageUrl: string | null,
): CatalogItem {
  return {
    id: `track:${track.id}`,
    type: 'track',
    title: track.name,
    subtitle: artistNames(track.artists ?? []),
    imageUrl,
  };
}

function uniqueReleases(items: SpotifyArtistAlbums['items']) {
  const seen = new Set<string>();

  return (items ?? []).filter((item) => {
    if (!item?.id || seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function toAlbumItems(items: SpotifyArtistAlbums['items']): CatalogItem[] {
  return uniqueReleases(items).map((item) => ({
    id: `album:${item.id}`,
    type: 'album' as const,
    title: item.name,
    subtitle: artistNames(item.artists ?? []),
    imageUrl: pickImage(item.images),
  }));
}

async function getAlbumTrackPage(
  accessToken: string,
  albumId: string,
  market: string,
) {
  return spotifyFetch<SpotifyAlbumTracks>(accessToken, `/albums/${albumId}/tracks`, {
    limit: String(PAGE_LIMIT),
    market,
  });
}

async function collectTracksFromReleases(
  accessToken: string,
  releases: Array<{ id: string; images?: SpotifyImage[] }>,
  market: string,
) {
  const tracks: CatalogItem[] = [];
  const seen = new Set<string>();

  for (const release of releases) {
    if (tracks.length >= PAGE_LIMIT) {
      break;
    }

    let page: SpotifyAlbumTracks;

    try {
      page = await getAlbumTrackPage(accessToken, release.id, market);
    } catch (error) {
      if (error instanceof SpotifyUnauthorizedError) {
        throw error;
      }

      break;
    }

    const imageUrl = pickImage(release.images);

    for (const item of page.items ?? []) {
      if (!item?.id || seen.has(item.id)) {
        continue;
      }

      seen.add(item.id);
      tracks.push(toTrackItem(item, imageUrl));

      if (tracks.length >= PAGE_LIMIT) {
        return tracks;
      }
    }
  }

  return tracks;
}

export async function getAlbumDetail(
  accessToken: string,
  albumId: string,
  market: string,
) {
  const album = await spotifyFetch<SpotifyAlbum>(
    accessToken,
    `/albums/${albumId}`,
    { market },
  );
  const imageUrl = pickImage(album.images);

  return {
    id: album.id,
    title: album.name,
    subtitle: artistNames(album.artists ?? []),
    imageUrl,
    tracks: (album.tracks?.items ?? [])
      .filter((item) => item?.id)
      .map((item) => toTrackItem(item, imageUrl)),
  } satisfies AlbumDetail;
}

async function getArtistReleases(
  accessToken: string,
  artistId: string,
  market: string,
  includeGroups: 'album' | 'single',
) {
  return spotifyFetch<SpotifyArtistAlbums>(accessToken, `/artists/${artistId}/albums`, {
    include_groups: includeGroups,
    limit: String(PAGE_LIMIT),
    market,
  });
}

export async function getArtistDetail(
  accessToken: string,
  artistId: string,
  market: string,
) {
  const [artist, albumPage] = await Promise.all([
    spotifyFetch<SpotifyArtist>(accessToken, `/artists/${artistId}`),
    getArtistReleases(accessToken, artistId, market, 'album'),
  ]);

  const albums = uniqueReleases(albumPage.items);
  let tracks = await collectTracksFromReleases(accessToken, albums, market);

  if (tracks.length < PAGE_LIMIT) {
    const searched = await searchCatalog(
      accessToken,
      `artist:"${artist.name}"`,
      'track',
      market,
    );
    const seen = new Set(tracks.map((item) => item.id));
    tracks = [
      ...tracks,
      ...searched.filter((item) => !seen.has(item.id)),
    ].slice(0, PAGE_LIMIT);
  }

  return {
    id: artist.id,
    title: artist.name,
    imageUrl: pickImage(artist.images),
    tracks,
    albums: toAlbumItems(albums),
  } satisfies ArtistDetail;
}

export async function getTrackDetail(
  accessToken: string,
  trackId: string,
  market: string,
) {
  const track = await spotifyFetch<SpotifyTrack>(
    accessToken,
    `/tracks/${trackId}`,
    { market },
  );

  return {
    id: track.id,
    title: track.name,
    subtitle: artistNames(track.artists ?? []),
    imageUrl: pickImage(track.album?.images),
    artistName: track.artists?.[0]?.name ?? '',
  } satisfies TrackDetail;
}
