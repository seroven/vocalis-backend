CREATE TABLE IF NOT EXISTS recordings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  spotify_id VARCHAR(64) NOT NULL,
  track_title VARCHAR(255) NOT NULL,
  artist_name VARCHAR(255) NOT NULL,
  image_url VARCHAR(512) NULL,
  title VARCHAR(80) NULL,
  duration_ms INT UNSIGNED NOT NULL,
  mime_type VARCHAR(80) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY recordings_user_track_index (user_id, spotify_id),
  CONSTRAINT recordings_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
