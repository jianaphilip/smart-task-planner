"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const planner_1 = require("../services/planner");
const scheduler_1 = require("../utils/scheduler");
const schema = zod_1.z.object({
    goal: zod_1.z.string().min(5),
    horizonDays: zod_1.z.number().int().positive().optional(),
    startDate: zod_1.z.string().optional(),
});
exports.planRouter = (0, express_1.Router)();
exports.planRouter.post("/plan", async (req, res) => {
    const parse = schema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: "Invalid body", details: parse.error.flatten() });
    const { goal, startDate } = parse.data;
    try {
        const tasks = await (0, planner_1.planTasks)(goal);
        const start = startDate ?? new Date().toISOString().slice(0, 10);
        const scheduled = (0, scheduler_1.scheduleTasks)(tasks, start);
        const response = { goal, tasks: scheduled.tasks, timeline: { startDate: scheduled.startDate, endDate: scheduled.endDate, totalDays: scheduled.totalDays } };
        return res.json(response);
    }
    catch (e) {
        return res.status(500).json({ error: e?.message ?? "Failed to plan" });
    }
});
//# sourceMappingURL=plan.js.map