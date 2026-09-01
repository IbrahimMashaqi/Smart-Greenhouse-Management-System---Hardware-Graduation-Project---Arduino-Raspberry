USE greenhouse_db;

-- Default device
INSERT INTO devices (id, name, location)
VALUES (1, 'Greenhouse 1', 'Main Facility')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- System settings
INSERT INTO system_settings (device_id, baud_rate, telemetry_log_interval_seconds)
VALUES (1, 9600, 60)
ON DUPLICATE KEY UPDATE baud_rate = VALUES(baud_rate);

-- Default thresholds (match Arduino firmware defaults)
INSERT INTO threshold_settings (
  device_id,
  temp_threshold,
  lux_night_threshold,
  lux_high_threshold,
  dry_threshold,
  water_tank_empty_threshold,
  spray_tank_empty_threshold
) VALUES (1, 28.0, 30.0, 100.0, 750, 11.0, 10.5)
ON DUPLICATE KEY UPDATE
  temp_threshold = VALUES(temp_threshold),
  lux_night_threshold = VALUES(lux_night_threshold),
  lux_high_threshold = VALUES(lux_high_threshold),
  dry_threshold = VALUES(dry_threshold),
  water_tank_empty_threshold = VALUES(water_tank_empty_threshold),
  spray_tank_empty_threshold = VALUES(spray_tank_empty_threshold);

-- Default schedules
INSERT INTO watering_schedules (id, device_id, name, time, enabled, duration_seconds, type)
VALUES
  ('sched-1', 1, 'Morning Irrigation', '08:00:00', TRUE, 30, 'watering'),
  ('sched-2', 1, 'Evening Hydration',  '18:00:00', TRUE, 45, 'watering'),
  ('sched-3', 1, 'Morning Spray',      '07:00:00', TRUE, 20, 'spraying'),
  ('sched-4', 1, 'Afternoon Spray',    '14:00:00', TRUE, 25, 'spraying')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO schedule_days (schedule_id, day_of_week) VALUES
  ('sched-1', 'Mon'), ('sched-1', 'Tue'), ('sched-1', 'Wed'), ('sched-1', 'Thu'),
  ('sched-1', 'Fri'), ('sched-1', 'Sat'), ('sched-1', 'Sun'),
  ('sched-2', 'Mon'), ('sched-2', 'Wed'), ('sched-2', 'Fri'),
  ('sched-3', 'Mon'), ('sched-3', 'Thu'),
  ('sched-4', 'Tue'), ('sched-4', 'Fri')
ON DUPLICATE KEY UPDATE day_of_week = VALUES(day_of_week);
