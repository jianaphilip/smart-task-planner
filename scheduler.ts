import { TaskItem } from "./types";

export function scheduleTasks(tasks: TaskItem[], startDateIso: string): { tasks: TaskItem[]; startDate: string; endDate: string; totalDays: number } {
    // Topologically sort tasks by dependencies (Kahn's algorithm)
    const idToTask = new Map<string, TaskItem>();
    tasks.forEach(t => idToTask.set(t.id, { ...t }));

    const indegree = new Map<string, number>();
    tasks.forEach(t => indegree.set(t.id, 0));
    tasks.forEach(t => t.dependsOnIds.forEach(dep => indegree.set(t.id, (indegree.get(t.id) ?? 0) + 1)));

    const queue: string[] = [];
    indegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });

    const sorted: string[] = [];
    while (queue.length) {
        const id = queue.shift()!;
        sorted.push(id);
        tasks.forEach(t => {
            if (t.dependsOnIds.includes(id)) {
                const d = (indegree.get(t.id) ?? 0) - 1;
                indegree.set(t.id, d);
                if (d === 0) queue.push(t.id);
            }
        });
    }

    if (sorted.length !== tasks.length) {
        throw new Error("Cyclic dependency detected in tasks");
    }

    const start = new Date(startDateIso);
    const idToEndDate = new Map<string, Date>();
    const idToStartDate = new Map<string, Date>();

    for (const id of sorted) {
        const task = idToTask.get(id)!;
        let earliestStart = new Date(start);
        for (const dep of task.dependsOnIds) {
            const depEnd = idToEndDate.get(dep);
            if (depEnd && depEnd > earliestStart) earliestStart = new Date(depEnd);
        }
        const taskStart = new Date(earliestStart);
        const taskEnd = new Date(taskStart);
        taskEnd.setDate(taskEnd.getDate() + Math.max(1, Math.ceil(task.durationDays)));
        idToStartDate.set(id, taskStart);
        idToEndDate.set(id, taskEnd);
        task.startDate = taskStart.toISOString().slice(0, 10);
        task.endDate = taskEnd.toISOString().slice(0, 10);
        idToTask.set(id, task);
    }

    const scheduled = Array.from(idToTask.values());
    const overallStart = scheduled.reduce((min, t) => t.startDate! < min ? t.startDate! : min, scheduled[0]?.startDate!);
    const overallEnd = scheduled.reduce((max, t) => t.endDate! > max ? t.endDate! : max, scheduled[0]?.endDate!);
    const totalDays = Math.ceil((new Date(overallEnd).getTime() - new Date(overallStart).getTime()) / (1000 * 60 * 60 * 24));

    return { tasks: scheduled, startDate: overallStart, endDate: overallEnd, totalDays };
}

