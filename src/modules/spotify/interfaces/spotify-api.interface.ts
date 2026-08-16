export interface SpotifyImage {
  url: string;
  width?: number | null;
}

export interface SpotifyArtistRef {
  name: string;
}

export interface SpotifySearchTrack {
  id: string;
  name: string;
  artists: SpotifyArtistRef[];
  album?: { images?: SpotifyImage[] };
}

export interface SpotifySearchAlbum {
  id: string;
  name: string;
  artists: SpotifyArtistRef[];
  images?: SpotifyImage[];
}

export interface SpotifySearchArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
}

export interface SpotifySearchResponse {
  tracks?: { items: SpotifySearchTrack[] };
  albums?: { items: SpotifySearchAlbum[] };
  artists?: { items: SpotifySearchArtist[] };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images?: SpotifyImage[];
  artists: SpotifyArtistRef[];
  tracks?: {
    items: Array<{
      id: string;
      name: string;
      track_number: number;
      artists: SpotifyArtistRef[];
    }>;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  images?: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtistRef[];
  album?: {
    name: string;
    images?: SpotifyImage[];
  };
  duration_ms?: number;
}

export interface SpotifyArtistAlbums {
  items: Array<{
    id: string;
    name: string;
    album_group?: string;
    album_type?: string;
    artists: SpotifyArtistRef[];
    images?: SpotifyImage[];
  }>;
}

export interface SpotifyAlbumTracks {
  items: Array<{
    id: string;
    name: string;
    track_number: number;
    artists: SpotifyArtistRef[];
  }>;
}
