CREATE TABLE IF NOT EXISTS user_track_lyrics (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  spotify_id VARCHAR(64) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY user_track_lyrics_unique (user_id, spotify_id),
  KEY user_track_lyrics_spotify_index (spotify_id),
  CONSTRAINT user_track_lyrics_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS global_track_lyrics (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  spotify_id VARCHAR(64) NOT NULL,
  body TEXT NOT NULL,
  published_by INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY global_track_lyrics_unique (spotify_id),
  CONSTRAINT global_track_lyrics_user_fk
    FOREIGN KEY (published_by) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
