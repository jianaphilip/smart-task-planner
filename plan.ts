import { Router } from "express";
import { z } from "zod";
import { planTasks } from "../services/planner";
import { scheduleTasks } from "../utils/scheduler";
import { PlanResponseBody } from "../utils/types";

const schema = z.object({
    goal: z.string().min(5),
    horizonDays: z.number().int().positive().optional(),
    startDate: z.string().optional(),
});

export const planRouter = Router();

planRouter.post("/plan", async (req, res) => {
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: "Invalid body", details: parse.error.flatten() });
    const { goal, startDate } = parse.data;
    try {
        const tasks = await planTasks(goal);
        const start = startDate ?? new Date().toISOString().slice(0, 10);
        const scheduled = scheduleTasks(tasks, start) as any;
        const response: PlanResponseBody = { goal, tasks: scheduled.tasks, timeline: { startDate: scheduled.startDate, endDate: scheduled.endDate, totalDays: scheduled.totalDays } };
        return res.json(response);
    } catch (e: any) {
        return res.status(500).json({ error: e?.message ?? "Failed to plan" });
    }
});


