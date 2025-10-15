import { Router } from "express";
import { z } from "zod";
import { 
  createPlan, 
  createTask, 
  updateTask, 
  deleteTask, 
  getTask,
  getAllTasks,
  getTodaysTasks,
  getUpcomingTasks,
  getOverdueTasks,
  getTasksByPriority,
  createRecurringTask,
  getTodaysRecurringTasks,
  completeTaskInstance
} from "../database/taskService";
import { planTasks } from "../services/planner";
import { scheduleTasks } from "../utils/scheduler";

const router = Router();

// Plan generation (existing functionality)
const planSchema = z.object({
  goal: z.string().min(5),
  horizonDays: z.number().int().positive().optional(),
  startDate: z.string().optional(),
});

router.post("/plan", async (req, res) => {
  const parse = planSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid body", details: parse.error.flatten() });
  
    const { goal, startDate } = parse.data;
    try {
      const tasks = await planTasks(goal);
      // Default to tomorrow if no start date provided, to ensure tasks appear in upcoming
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = startDate ?? tomorrow.toISOString().slice(0, 10);
      const scheduled = scheduleTasks(tasks, start);
    
    // Save plan and tasks to database
    const planId = createPlan(goal);
    const savedTasks = tasks.map(task => {
      const taskData: any = {
        plan_id: planId,
        title: task.title,
        description: task.description,
        durationDays: task.durationDays,
        dependsOnIds: task.dependsOnIds,
        priority: task.priority,
        status: 'pending'
      };
      
      if (task.startDate) taskData.startDate = task.startDate;
      if (task.endDate) taskData.endDate = task.endDate;
      
      const taskId = createTask(taskData);
      return { ...task, id: taskId, plan_id: planId, status: 'pending' };
    });
    
    return res.json({ 
      goal, 
      plan_id: planId,
      tasks: savedTasks, 
      timeline: { 
        startDate: scheduled.startDate, 
        endDate: scheduled.endDate, 
        totalDays: scheduled.totalDays 
      } 
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to plan" });
  }
});

// Task CRUD operations
router.get("/tasks", (req, res) => {
  try {
    const tasks = getAllTasks();
    return res.json(tasks);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to get tasks" });
  }
});

router.get("/tasks/today", (req, res) => {
  try {
    const tasks = getTodaysTasks();
    const recurring = getTodaysRecurringTasks();
    return res.json({ tasks, recurring });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to get today's tasks" });
  }
});

router.get("/tasks/upcoming", (req, res) => {
  try {
    const tasks = getUpcomingTasks();
    return res.json(tasks);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to get upcoming tasks" });
  }
});

router.get("/tasks/overdue", (req, res) => {
  try {
    const tasks = getOverdueTasks();
    return res.json(tasks);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to get overdue tasks" });
  }
});

router.get("/tasks/priority", (req, res) => {
  try {
    const tasks = getTasksByPriority();
    return res.json(tasks);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to get prioritized tasks" });
  }
});

router.get("/tasks/:id", (req, res) => {
  try {
    const task = getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    return res.json(task);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to get task" });
  }
});

const taskUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['pending', 'completed', 'archived']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

router.patch("/tasks/:id", (req, res) => {
  const parse = taskUpdateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid body", details: parse.error.flatten() });
  
  try {
    updateTask(req.params.id, parse.data as any);
    const updatedTask = getTask(req.params.id);
    return res.json(updatedTask);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to update task" });
  }
});

router.delete("/tasks/:id", (req, res) => {
  try {
    deleteTask(req.params.id);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to delete task" });
  }
});

// Recurring tasks
const recurringTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  duration_days: z.number().int().positive().default(1),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  frequency_value: z.number().int().positive().default(1),
  start_date: z.string(),
  end_date: z.string().optional(),
});

router.post("/recurring-tasks", (req, res) => {
  const parse = recurringTaskSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid body", details: parse.error.flatten() });
  
  try {
    const recurringTaskData: any = {
      title: parse.data.title,
      duration_days: parse.data.duration_days,
      priority: parse.data.priority,
      frequency: parse.data.frequency,
      frequency_value: parse.data.frequency_value,
      start_date: parse.data.start_date
    };
    
    if (parse.data.description) recurringTaskData.description = parse.data.description;
    if (parse.data.end_date) recurringTaskData.end_date = parse.data.end_date;
    
    const taskId = createRecurringTask(recurringTaskData);
    return res.json({ id: taskId, ...parse.data });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to create recurring task" });
  }
});

router.post("/task-instances/:id/complete", (req, res) => {
  try {
    completeTaskInstance(req.params.id);
    return res.json({ success: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to complete task" });
  }
});

// Debug endpoint to see all tasks
router.get("/debug/tasks", (req, res) => {
  try {
    const tasks = getAllTasks();
    const today = new Date().toISOString().slice(0, 10);
    const debug = {
      today,
      totalTasks: tasks.length,
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        priority: t.priority,
        isToday: t.startDate === today,
        isUpcoming: t.startDate ? t.startDate > today : false,
        isOverdue: t.endDate && t.endDate < today
      }))
    };
    return res.json(debug);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to get debug info" });
  }
});

export default router;
