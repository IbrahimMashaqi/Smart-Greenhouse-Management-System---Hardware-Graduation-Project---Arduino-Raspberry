-- ============================================================
-- Smart Greenhouse Control System — MySQL Database Schema
-- ============================================================
-- Setup:
--   mysql -u root -p < database/schema.sql
--   mysql -u root -p greenhouse_db < database/seed.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS greenhouse_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE greenhouse_db;

-- ------------------------------------------------------------
-- Devices (supports multiple greenhouses in the future)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS devices (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL DEFAULT 'Greenhouse 1',
  location      VARCHAR(255) NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- System settings (baud rate, logging interval, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id             INT UNSIGNED NOT NULL,
  baud_rate             INT UNSIGNED NOT NULL DEFAULT 9600,
  telemetry_log_interval_seconds INT UNSIGNED NOT NULL DEFAULT 60,
  serial_log_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  low_water_warning_percent DECIMAL(5,2) NOT NULL DEFAULT 25.00,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_system_settings_device (device_id),
  CONSTRAINT fk_system_settings_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Threshold settings (synced from UI → DB → Arduino on startup)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS threshold_settings (
  id                          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id                   INT UNSIGNED NOT NULL,
  temp_threshold              DECIMAL(4,1) NOT NULL DEFAULT 28.0,
  lux_night_threshold         DECIMAL(6,1) NOT NULL DEFAULT 30.0,
  lux_high_threshold          DECIMAL(6,1) NOT NULL DEFAULT 100.0,
  dry_threshold               INT UNSIGNED NOT NULL DEFAULT 750,
  water_tank_empty_threshold  DECIMAL(4,1) NOT NULL DEFAULT 11.0,
  spray_tank_empty_threshold  DECIMAL(4,1) NOT NULL DEFAULT 10.5,
  updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by                  VARCHAR(50) NULL DEFAULT 'dashboard',
  UNIQUE KEY uq_threshold_settings_device (device_id),
  CONSTRAINT fk_threshold_settings_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Telemetry readings (full sensor snapshot, logged every minute)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS telemetry_readings (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id         INT UNSIGNED NOT NULL,
  recorded_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  -- Environmental sensors
  temperature       DECIMAL(4,1) NOT NULL,
  humidity          DECIMAL(4,1) NOT NULL,
  lux               DECIMAL(8,1) NOT NULL,

  -- Soil sensors
  soil1             INT UNSIGNED NOT NULL,
  soil2             INT UNSIGNED NOT NULL,
  soil_avg          INT UNSIGNED NOT NULL,
  soil_status       ENUM('WET','DRY') NOT NULL,

  -- Actuator states
  fan               BOOLEAN NOT NULL DEFAULT FALSE,
  light             BOOLEAN NOT NULL DEFAULT FALSE,
  umbrella          ENUM('OPEN','CLOSED','MOVING') NOT NULL DEFAULT 'OPEN',
  pump              BOOLEAN NOT NULL DEFAULT FALSE,
  spray_running     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Water tank
  water_tank_dist   DECIMAL(4,1) NOT NULL,
  water_tank_ok     BOOLEAN NOT NULL DEFAULT TRUE,
  water_tank_percent DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Spray tank
  spray_tank_dist   DECIMAL(4,1) NOT NULL,
  spray_tank_ok     BOOLEAN NOT NULL DEFAULT TRUE,
  spray_tank_percent DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Threshold snapshot at time of reading (for historical context)
  temp_threshold              DECIMAL(4,1) NOT NULL,
  lux_night_threshold         DECIMAL(6,1) NOT NULL,
  lux_high_threshold          DECIMAL(6,1) NOT NULL,
  dry_threshold               INT UNSIGNED NOT NULL,
  water_tank_empty_threshold  DECIMAL(4,1) NOT NULL,
  spray_tank_empty_threshold  DECIMAL(4,1) NOT NULL,

  INDEX idx_telemetry_device_time (device_id, recorded_at),
  INDEX idx_telemetry_recorded_at (recorded_at),
  CONSTRAINT fk_telemetry_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Watering / spraying schedules
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS watering_schedules (
  id                VARCHAR(36) PRIMARY KEY,
  device_id         INT UNSIGNED NOT NULL,
  name              VARCHAR(100) NOT NULL,
  time              TIME NOT NULL,
  enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  duration_seconds  INT UNSIGNED NOT NULL DEFAULT 30,
  type              ENUM('watering','spraying') NOT NULL,
  last_run_at       DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_schedules_device (device_id),
  INDEX idx_schedules_enabled_time (enabled, time),
  CONSTRAINT fk_schedules_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS schedule_days (
  schedule_id   VARCHAR(36) NOT NULL,
  day_of_week   ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  PRIMARY KEY (schedule_id, day_of_week),
  CONSTRAINT fk_schedule_days_schedule
    FOREIGN KEY (schedule_id) REFERENCES watering_schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Schedule execution log
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_executions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  schedule_id     VARCHAR(36) NOT NULL,
  device_id       INT UNSIGNED NOT NULL,
  executed_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type            ENUM('watering','spraying') NOT NULL,
  success         BOOLEAN NOT NULL DEFAULT TRUE,
  failure_reason  VARCHAR(255) NULL,
  command_sent    VARCHAR(50) NOT NULL,
  INDEX idx_executions_schedule (schedule_id),
  INDEX idx_executions_time (executed_at),
  CONSTRAINT fk_executions_schedule
    FOREIGN KEY (schedule_id) REFERENCES watering_schedules(id) ON DELETE CASCADE,
  CONSTRAINT fk_executions_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Actuator state change events
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actuator_events (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id     INT UNSIGNED NOT NULL,
  event_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  actuator      ENUM('fan','pump','spray','light','umbrella') NOT NULL,
  state         VARCHAR(20) NOT NULL,
  trigger_source ENUM('auto','manual','schedule','serial','simulation') NOT NULL DEFAULT 'auto',
  raw_message   TEXT NULL,
  INDEX idx_actuator_device_time (device_id, event_at),
  CONSTRAINT fk_actuator_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Low tank warnings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tank_warnings (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id       INT UNSIGNED NOT NULL,
  warned_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tank_type       ENUM('water','spray') NOT NULL,
  distance_cm     DECIMAL(4,1) NOT NULL,
  threshold_cm    DECIMAL(4,1) NOT NULL,
  level_percent   DECIMAL(5,2) NOT NULL,
  message         TEXT NULL,
  source          ENUM('arduino','dashboard','simulation') NOT NULL DEFAULT 'dashboard',
  acknowledged    BOOLEAN NOT NULL DEFAULT FALSE,
  INDEX idx_warnings_device_time (device_id, warned_at),
  CONSTRAINT fk_warnings_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Serial communication log (optional persistence)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS serial_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id     INT UNSIGNED NOT NULL,
  logged_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  direction     ENUM('IN','OUT','SYS') NOT NULL,
  text          TEXT NOT NULL,
  INDEX idx_serial_device_time (device_id, logged_at),
  CONSTRAINT fk_serial_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Connection sessions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connection_sessions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id       INT UNSIGNED NOT NULL,
  connected_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  disconnected_at DATETIME NULL,
  baud_rate       INT UNSIGNED NOT NULL DEFAULT 9600,
  status          ENUM('CONNECTED','DISCONNECTED','ERROR','SIMULATING') NOT NULL,
  INDEX idx_sessions_device (device_id),
  CONSTRAINT fk_sessions_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Planting robot events
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Daily aggregated statistics (pre-computed for fast dashboards)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_statistics (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  device_id             INT UNSIGNED NOT NULL,
  stat_date             DATE NOT NULL,

  avg_temperature       DECIMAL(4,1) NULL,
  min_temperature       DECIMAL(4,1) NULL,
  max_temperature       DECIMAL(4,1) NULL,
  avg_humidity          DECIMAL(4,1) NULL,
  min_humidity          DECIMAL(4,1) NULL,
  max_humidity          DECIMAL(4,1) NULL,
  avg_lux               DECIMAL(8,1) NULL,
  avg_soil              INT UNSIGNED NULL,
  min_soil              INT UNSIGNED NULL,
  max_soil              INT UNSIGNED NULL,
  avg_water_tank_percent DECIMAL(5,2) NULL,
  avg_spray_tank_percent DECIMAL(5,2) NULL,

  fan_on_minutes        INT UNSIGNED NOT NULL DEFAULT 0,
  pump_on_minutes       INT UNSIGNED NOT NULL DEFAULT 0,
  spray_on_minutes      INT UNSIGNED NOT NULL DEFAULT 0,
  light_on_minutes      INT UNSIGNED NOT NULL DEFAULT 0,

  irrigation_runs       INT UNSIGNED NOT NULL DEFAULT 0,
  spray_runs            INT UNSIGNED NOT NULL DEFAULT 0,
  planting_runs         INT UNSIGNED NOT NULL DEFAULT 0,
  plants_planted        INT UNSIGNED NOT NULL DEFAULT 0,
  water_warnings        INT UNSIGNED NOT NULL DEFAULT 0,
  spray_warnings        INT UNSIGNED NOT NULL DEFAULT 0,
  reading_count         INT UNSIGNED NOT NULL DEFAULT 0,

  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_daily_stats (device_id, stat_date),
  CONSTRAINT fk_daily_stats_device
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
) ENGINE=InnoDB;
