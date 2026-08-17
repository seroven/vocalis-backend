export interface RecordingRecord {
  id: number;
  user_id: number;
  spotify_id: string;
  track_title: string;
  artist_name: string;
  image_url: string | null;
  title: string | null;
  duration_ms: number;
  mime_type: string;
  file_path: string;
  created_at: Date;
}

export interface RecordingPayload {
  spotifyId: string;
  trackTitle: string;
  artistName: string;
  imageUrl: string | null;
  durationMs: number;
  mimeType: string;
  filePath: string;
}

export interface RecordingItem {
  id: number;
  title: string | null;
  durationMs: number;
  createdAt: string;
}

export interface RecordingTrackGroup {
  spotifyId: string;
  title: string;
  artistName: string;
  imageUrl: string | null;
  recordings: RecordingItem[];
}

export function toRecordingItem(record: RecordingRecord): RecordingItem {
  return {
    id: record.id,
    title: record.title,
    durationMs: record.duration_ms,
    createdAt: new Date(record.created_at).toISOString(),
  };
}
