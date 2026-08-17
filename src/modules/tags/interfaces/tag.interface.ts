export const TAG_COLORS = [
  'accent',
  'rose',
  'amber',
  'lime',
  'sky',
  'violet',
  'coral',
  'mint',
] as const;

export const TAG_SHAPES = [
  'mark',
  'pill',
  'underline',
  'wave',
  'outline',
  'slash',
] as const;

export const TAG_SCOPES = ['general', 'artist', 'album', 'track'] as const;

export type TagColor = (typeof TAG_COLORS)[number];
export type TagShape = (typeof TAG_SHAPES)[number];
export type TagScope = (typeof TAG_SCOPES)[number];

export interface TagRecord {
  id: number;
  user_id: number;
  name: string;
  color: TagColor;
  shape: TagShape;
  scope: TagScope;
  target_id: string | null;
  target_name: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface LyricTagMarkRecord {
  id: number;
  user_id: number;
  tag_id: number;
  spotify_id: string;
  line_index: number;
  start_offset: number;
  end_offset: number;
  excerpt: string;
  created_at: Date;
  tag_name: string;
  tag_color: TagColor;
  tag_shape: TagShape;
  tag_scope: TagScope;
}

export interface TagPayload {
  name: string;
  color: TagColor;
  shape: TagShape;
  scope: TagScope;
  targetId: string | null;
  targetName: string | null;
}

export function isTagColor(value: unknown): value is TagColor {
  return typeof value === 'string' && TAG_COLORS.includes(value as TagColor);
}

export function isTagShape(value: unknown): value is TagShape {
  return typeof value === 'string' && TAG_SHAPES.includes(value as TagShape);
}

export function isTagScope(value: unknown): value is TagScope {
  return typeof value === 'string' && TAG_SCOPES.includes(value as TagScope);
}

export function toTag(record: TagRecord) {
  return {
    id: record.id,
    name: record.name,
    color: record.color,
    shape: record.shape,
    scope: record.scope,
    targetId: record.target_id,
    targetName: record.target_name,
  };
}

export function toLyricTagMark(record: LyricTagMarkRecord) {
  return {
    id: record.id,
    tagId: record.tag_id,
    spotifyId: record.spotify_id,
    lineIndex: record.line_index,
    startOffset: record.start_offset,
    endOffset: record.end_offset,
    excerpt: record.excerpt,
    tag: {
      id: record.tag_id,
      name: record.tag_name,
      color: record.tag_color,
      shape: record.tag_shape,
      scope: record.tag_scope,
    },
  };
}
