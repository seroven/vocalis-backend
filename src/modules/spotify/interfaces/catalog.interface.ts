export type CatalogItemType = 'track' | 'album' | 'artist';

export interface CatalogItem {
  id: string;
  type: CatalogItemType;
  title: string;
  subtitle: string;
  imageUrl: string | null;
}

export interface AlbumDetail {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  tracks: CatalogItem[];
}

export interface ArtistDetail {
  id: string;
  title: string;
  imageUrl: string | null;
  tracks: CatalogItem[];
  albums: CatalogItem[];
}

export interface TrackDetail {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  artistName: string;
  durationMs: number;
}

export interface TrackLyricsData {
  track: TrackDetail;
  lyrics: string | null;
}
