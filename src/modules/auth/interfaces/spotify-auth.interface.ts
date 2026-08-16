export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SpotifyProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  country: string | null;
  product: string;
  uri: string | null;
  images?: Array<{ url: string }>;
}
