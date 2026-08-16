export interface LyricLineRecord {
  line_index: number;
  text: string;
  start_ms: number | null;
  end_ms: number | null;
}

export interface LyricLine {
  text: string;
  startMs: number | null;
  endMs: number | null;
}

export interface LyricSyncPayload {
  source: 'global' | 'user' | null;
  complete: boolean;
  lines: LyricLine[];
}

export interface FocusTrackMeta {
  title: string;
  subtitle: string;
  imageUrl: string | null;
}

export interface FocusTrackRecord {
  spotify_id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  updated_at: Date;
}

export function toLyricLine(record: LyricLineRecord): LyricLine {
  return {
    text: record.text,
    startMs: record.start_ms,
    endMs: record.end_ms,
  };
}

export function isSyncComplete(lines: LyricLine[]) {
  return (
    lines.length > 0 &&
    lines.every(
      (line) =>
        line.startMs != null &&
        line.endMs != null &&
        line.endMs > line.startMs,
    )
  );
}
