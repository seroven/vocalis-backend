CREATE TABLE IF NOT EXISTS user_lyric_syncs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  spotify_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  subtitle VARCHAR(255) NOT NULL DEFAULT '',
  image_url VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY user_lyric_syncs_unique (user_id, spotify_id),
  KEY user_lyric_syncs_spotify_index (spotify_id),
  CONSTRAINT user_lyric_syncs_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_lyric_sync_lines (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sync_id INT UNSIGNED NOT NULL,
  line_index INT UNSIGNED NOT NULL,
  text VARCHAR(512) NOT NULL,
  start_ms INT UNSIGNED NULL,
  end_ms INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY user_lyric_sync_lines_unique (sync_id, line_index),
  CONSTRAINT user_lyric_sync_lines_sync_fk
    FOREIGN KEY (sync_id) REFERENCES user_lyric_syncs (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS global_lyric_syncs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  spotify_id VARCHAR(64) NOT NULL,
  published_by INT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  subtitle VARCHAR(255) NOT NULL DEFAULT '',
  image_url VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY global_lyric_syncs_unique (spotify_id),
  CONSTRAINT global_lyric_syncs_user_fk
    FOREIGN KEY (published_by) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS global_lyric_sync_lines (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sync_id INT UNSIGNED NOT NULL,
  line_index INT UNSIGNED NOT NULL,
  text VARCHAR(512) NOT NULL,
  start_ms INT UNSIGNED NULL,
  end_ms INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY global_lyric_sync_lines_unique (sync_id, line_index),
  CONSTRAINT global_lyric_sync_lines_sync_fk
    FOREIGN KEY (sync_id) REFERENCES global_lyric_syncs (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
