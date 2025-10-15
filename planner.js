"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.planTasks = planTasks;
const uuid_1 = require("uuid");
const llm_1 = require("./llm");
function heuristicDraft(goal) {
    const isFast = /day|week|weeks|\b2\s*weeks\b|quick|fast/i.test(goal);
    const base = [
        { title: "Clarify scope & success metrics", durationDays: 1, priority: "high" },
        { title: "Research & requirements", durationDays: 2, priority: "high" },
        { title: "Plan milestones & timeline", durationDays: 1, priority: "high" },
        { title: "Implementation", durationDays: isFast ? 5 : 10, priority: "medium" },
        { title: "Testing & iteration", durationDays: isFast ? 2 : 5, priority: "medium" },
        { title: "Launch & comms", durationDays: 1, priority: "high" }
    ];
    base[1].dependsOnTitles = [base[0].title];
    base[2].dependsOnTitles = [base[1].title];
    base[3].dependsOnTitles = [base[2].title];
    base[4].dependsOnTitles = [base[3].title];
    base[5].dependsOnTitles = [base[4].title];
    return base;
}
async function planTasks(goal) {
    const llm = await (0, llm_1.generateWithLlm)(goal);
    const drafts = llm ?? heuristicDraft(goal);
    // Normalize and assign ids, map dependencies by title to ids
    const tasks = drafts.map(d => ({
        id: (0, uuid_1.v4)(),
        title: d.title,
        description: d.description ?? "",
        durationDays: Math.max(1, Math.ceil(d.durationDays ?? 1)),
        dependsOnIds: [],
        priority: d.priority ?? "medium",
    }));
    const titleToId = new Map();
    tasks.forEach(t => titleToId.set(t.title.toLowerCase(), t.id));
    tasks.forEach((t, i) => {
        const src = drafts[i];
        const deps = src.dependsOnTitles ?? [];
        t.dependsOnIds = deps
            .map(name => titleToId.get(name.toLowerCase()))
            .filter((id) => Boolean(id));
    });
    return tasks;
}
//# sourceMappingURL=planner.js.map