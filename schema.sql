PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  state_json TEXT
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  workout_date TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  workout_type TEXT NOT NULL DEFAULT 'General Workout',
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date
  ON workout_logs (user_email, workout_date);

CREATE TABLE IF NOT EXISTS reward_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  adjustment_date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  total_users INTEGER NOT NULL,
  FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reward_history_date
  ON reward_history (adjustment_date);
