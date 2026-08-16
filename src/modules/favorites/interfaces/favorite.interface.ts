import type { CatalogItem, CatalogItemType } from '../../spotify/interfaces/catalog.interface.js';

export interface FavoriteRecord {
  id: number;
  user_id: number;
  item_type: CatalogItemType;
  spotify_id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  created_at: Date;
}

export interface FavoritePayload {
  type: CatalogItemType;
  spotifyId: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
}

export function toCatalogItem(favorite: FavoriteRecord): CatalogItem {
  return {
    id: `${favorite.item_type}:${favorite.spotify_id}`,
    type: favorite.item_type,
    title: favorite.title,
    subtitle: favorite.subtitle ?? '',
    imageUrl: favorite.image_url,
  };
}
