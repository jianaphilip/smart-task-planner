import { randomUUID } from "crypto";
import { addDays, format, isAfter, isBefore, isToday, parseISO, startOfDay } from "date-fns";
import db from "./schema";
import { TaskItem, Priority } from "../utils/types";

export interface TaskWithPlan extends TaskItem {
  plan_id?: string;
  status: 'pending' | 'completed' | 'archived';
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringTask {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  priority: Priority;
  frequency: 'daily' | 'weekly' | 'monthly';
  frequency_value: number;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface TaskInstance {
  id: string;
  recurring_task_id?: string;
  plan_id?: string;
  title: string;
  description: string;
  scheduled_date: string;
  status: 'pending' | 'completed' | 'archived';
  completed_at?: string;
  created_at: string;
}

// Task CRUD Operations
export function createPlan(goal: string): string {
  const planId = randomUUID();
  db.prepare(`
    INSERT INTO plans (id, goal) 
    VALUES (?, ?)
  `).run(planId, goal);
  return planId;
}

export function createTask(task: any): string {
  const taskId = randomUUID();
  db.prepare(`
    INSERT INTO tasks (id, plan_id, title, description, duration_days, start_date, end_date, depends_on_ids, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    taskId,
    task.plan_id,
    task.title,
    task.description,
    task.durationDays,
    task.startDate || null,
    task.endDate || null,
    JSON.stringify(task.dependsOnIds),
    task.priority,
    task.status
  );
  return taskId;
}

export function updateTask(id: string, updates: any): void {
  const fields = [];
  const values = [];
  
  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.priority !== undefined) {
    fields.push('priority = ?');
    values.push(updates.priority);
  }
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
    if (updates.status === 'completed') {
      fields.push('completed_at = CURRENT_TIMESTAMP');
    }
  }
  if (updates.startDate !== undefined) {
    fields.push('start_date = ?');
    values.push(updates.startDate);
  }
  if (updates.endDate !== undefined) {
    fields.push('end_date = ?');
    values.push(updates.endDate);
  }
  
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  db.prepare(`
    UPDATE tasks 
    SET ${fields.join(', ')}
    WHERE id = ?
  `).run(...values);
}

export function deleteTask(id: string): void {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function getTask(id: string): TaskWithPlan | null {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
  if (!row) return null;
  
  return {
    id: row.id,
    plan_id: row.plan_id,
    title: row.title,
    description: row.description,
    durationDays: row.duration_days,
    startDate: row.start_date,
    endDate: row.end_date,
    dependsOnIds: JSON.parse(row.depends_on_ids || '[]'),
    priority: row.priority,
    status: row.status,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function getAllTasks(): TaskWithPlan[] {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as any[];
  return rows.map(row => ({
    id: row.id,
    plan_id: row.plan_id,
    title: row.title,
    description: row.description,
    durationDays: row.duration_days,
    startDate: row.start_date,
    endDate: row.end_date,
    dependsOnIds: JSON.parse(row.depends_on_ids || '[]'),
    priority: row.priority,
    status: row.status,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

// Smart Views
export function getTodaysTasks(): TaskWithPlan[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const rows = db.prepare(`
    SELECT * FROM tasks 
    WHERE start_date <= ? AND end_date >= ? AND status = 'pending'
    ORDER BY priority DESC, start_date ASC
  `).all(today, today) as any[];
  
  return rows.map(row => ({
    id: row.id,
    plan_id: row.plan_id,
    title: row.title,
    description: row.description,
    durationDays: row.duration_days,
    startDate: row.start_date,
    endDate: row.end_date,
    dependsOnIds: JSON.parse(row.depends_on_ids || '[]'),
    priority: row.priority,
    status: row.status,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export function getUpcomingTasks(): TaskWithPlan[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const rows = db.prepare(`
    SELECT * FROM tasks 
    WHERE (start_date > ? OR (start_date = ? AND end_date > ?)) AND status = 'pending'
    ORDER BY start_date ASC, priority DESC
  `).all(today, today, today) as any[];
  
  return rows.map(row => ({
    id: row.id,
    plan_id: row.plan_id,
    title: row.title,
    description: row.description,
    durationDays: row.duration_days,
    startDate: row.start_date,
    endDate: row.end_date,
    dependsOnIds: JSON.parse(row.depends_on_ids || '[]'),
    priority: row.priority,
    status: row.status,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

export function getOverdueTasks(): TaskWithPlan[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const rows = db.prepare(`
    SELECT * FROM tasks 
    WHERE end_date < ? AND status = 'pending'
    ORDER BY end_date ASC, priority DESC
  `).all(today) as any[];
  
  return rows.map(row => ({
    id: row.id,
    plan_id: row.plan_id,
    title: row.title,
    description: row.description,
    durationDays: row.duration_days,
    startDate: row.start_date,
    endDate: row.end_date,
    dependsOnIds: JSON.parse(row.depends_on_ids || '[]'),
    priority: row.priority,
    status: row.status,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  }));
}

// Smart Prioritization Algorithm
export function calculatePriorityScore(task: TaskWithPlan): number {
  const now = new Date();
  const endDate = task.endDate ? parseISO(task.endDate) : now;
  const daysUntilDue = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Urgency score (higher for tasks due sooner)
  let urgencyScore = 0;
  if (daysUntilDue <= 0) urgencyScore = 100; // Overdue
  else if (daysUntilDue <= 1) urgencyScore = 80; // Due today/tomorrow
  else if (daysUntilDue <= 3) urgencyScore = 60; // Due this week
  else if (daysUntilDue <= 7) urgencyScore = 40; // Due next week
  else urgencyScore = 20; // Due later
  
  // Priority score
  let priorityScore = 0;
  switch (task.priority) {
    case 'high': priorityScore = 30; break;
    case 'medium': priorityScore = 20; break;
    case 'low': priorityScore = 10; break;
  }
  
  // Duration score (shorter tasks get slight boost)
  const durationScore = Math.max(0, 10 - task.durationDays);
  
  return urgencyScore + priorityScore + durationScore;
}

export function getTasksByPriority(): TaskWithPlan[] {
  const tasks = getAllTasks().filter(t => t.status === 'pending');
  return tasks.sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a));
}

// Recurring Tasks
export function createRecurringTask(task: any): string {
  const taskId = randomUUID();
  db.prepare(`
    INSERT INTO recurring_tasks (id, title, description, duration_days, priority, frequency, frequency_value, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    taskId,
    task.title,
    task.description || '',
    task.duration_days,
    task.priority,
    task.frequency,
    task.frequency_value,
    task.start_date,
    task.end_date || null
  );
  
  // Generate instances for the next 30 days
  generateRecurringInstances(taskId);
  return taskId;
}

export function generateRecurringInstances(recurringTaskId: string): void {
  const recurringTask = db.prepare('SELECT * FROM recurring_tasks WHERE id = ?').get(recurringTaskId) as any;
  if (!recurringTask) return;
  
  const startDate = parseISO(recurringTask.start_date);
  const endDate = recurringTask.end_date ? parseISO(recurringTask.end_date) : addDays(new Date(), 30);
  
  let currentDate = startDate;
  while (isBefore(currentDate, endDate)) {
    const instanceId = randomUUID();
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    // Check if instance already exists
    const existing = db.prepare('SELECT id FROM task_instances WHERE recurring_task_id = ? AND scheduled_date = ?').get(recurringTaskId, dateStr);
    if (!existing) {
      db.prepare(`
        INSERT INTO task_instances (id, recurring_task_id, title, description, scheduled_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(instanceId, recurringTaskId, recurringTask.title, recurringTask.description, dateStr);
    }
    
    // Calculate next occurrence
    switch (recurringTask.frequency) {
      case 'daily':
        currentDate = addDays(currentDate, recurringTask.frequency_value);
        break;
      case 'weekly':
        currentDate = addDays(currentDate, recurringTask.frequency_value * 7);
        break;
      case 'monthly':
        currentDate = addDays(currentDate, recurringTask.frequency_value * 30);
        break;
    }
  }
}

export function getTodaysRecurringTasks(): TaskInstance[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const rows = db.prepare(`
    SELECT * FROM task_instances 
    WHERE scheduled_date = ? AND status = 'pending'
    ORDER BY created_at ASC
  `).all(today) as any[];
  
  return rows.map(row => ({
    id: row.id,
    recurring_task_id: row.recurring_task_id,
    plan_id: row.plan_id,
    title: row.title,
    description: row.description,
    scheduled_date: row.scheduled_date,
    status: row.status,
    completed_at: row.completed_at,
    created_at: row.created_at
  }));
}

export function completeTaskInstance(id: string): void {
  db.prepare(`
    UPDATE task_instances 
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);
}
