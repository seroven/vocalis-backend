export interface PlayerTokenData {
  accessToken: string;
  expiresAt: string;
}

export interface StartPlaybackInput {
  trackId: string;
  deviceId: string;
}
