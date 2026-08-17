CREATE TABLE IF NOT EXISTS tags (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(80) NOT NULL,
  color VARCHAR(32) NOT NULL,
  shape VARCHAR(32) NOT NULL,
  scope ENUM('general', 'artist', 'album', 'track') NOT NULL DEFAULT 'general',
  target_id VARCHAR(64) NULL,
  target_name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY tags_user_id_index (user_id),
  KEY tags_user_scope_index (user_id, scope),
  KEY tags_user_target_index (user_id, scope, target_id),
  CONSTRAINT tags_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lyric_tag_marks (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  tag_id INT UNSIGNED NOT NULL,
  spotify_id VARCHAR(64) NOT NULL,
  line_index INT UNSIGNED NOT NULL,
  start_offset INT UNSIGNED NOT NULL,
  end_offset INT UNSIGNED NOT NULL,
  excerpt VARCHAR(512) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY lyric_tag_marks_track_index (user_id, spotify_id),
  CONSTRAINT lyric_tag_marks_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT lyric_tag_marks_tag_fk
    FOREIGN KEY (tag_id) REFERENCES tags (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
