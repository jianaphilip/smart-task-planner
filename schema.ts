import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tasks.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    goal TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    plan_id TEXT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    duration_days INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE,
    depends_on_ids TEXT DEFAULT '[]',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS recurring_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    duration_days INTEGER DEFAULT 1,
    priority TEXT DEFAULT 'medium',
    frequency TEXT NOT NULL, -- daily, weekly, monthly
    frequency_value INTEGER DEFAULT 1, -- every N days/weeks/months
    start_date DATE NOT NULL,
    end_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS task_instances (
    id TEXT PRIMARY KEY,
    recurring_task_id TEXT,
    plan_id TEXT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    scheduled_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recurring_task_id) REFERENCES recurring_tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_plan_id ON tasks(plan_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_start_date ON tasks(start_date);
  CREATE INDEX IF NOT EXISTS idx_task_instances_date ON task_instances(scheduled_date);
  CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);
`);

export default db;
