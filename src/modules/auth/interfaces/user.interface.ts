export interface UserRecord {
  id: number;
  spotify_id: string;
  display_name: string | null;
  email: string | null;
  country: string | null;
  product: string;
  spotify_uri: string | null;
  avatar_url: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserPayload {
  spotifyId: string;
  displayName: string | null;
  email: string | null;
  country: string | null;
  product: string;
  spotifyUri: string | null;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt: Date;
}

export interface PublicUser {
  id: number;
  spotifyId: string;
  displayName: string | null;
  email: string | null;
  country: string | null;
  product: string;
  avatarUrl: string | null;
}

export interface AuthUser {
  id: number;
  spotifyId: string;
}
