-- Migration: Add planting_events table
-- Run: mysql -u root -p greenhouse_db < database/add_planting_events.sql

CREATE TABLE IF NOT EXISTS planting_events (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id     INT UNSIGNED NOT NULL,
  started_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at   DATETIME NULL,
  status        ENUM('RUNNING','COMPLETED','INTERRUPTED') NOT NULL DEFAULT 'RUNNING',
  plants_planted INT UNSIGNED NOT NULL DEFAULT 0,
  trigger_source ENUM('manual','schedule','simulation') NOT NULL DEFAULT 'manual',
  notes         VARCHAR(255) NULL,
  INDEX idx_planting_device_time (device_id, started_at),
  CONSTRAINT fk_planting_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;
