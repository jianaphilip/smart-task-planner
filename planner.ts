import { randomUUID } from "crypto";
import { TaskItem } from "../utils/types";
import { generateWithLlm, LlmTaskDraft } from "./llm";

function extractTimeframeDays(goal: string): number | null {
    const lowerGoal = goal.toLowerCase();
    const match = lowerGoal.match(/(\d+)\s*(day|days|week|weeks|month|months)/);
    const numStr = match?.[1];
    const unit = match?.[2];
    if (!numStr || !unit) return null;
    const num = Number(numStr);
    if (!Number.isFinite(num)) return null;
    let days = num;
    if (unit.includes("week")) days = num * 7;
    else if (unit.includes("month")) days = num * 30;
    // else day(s) as is
    return Math.max(1, Math.floor(days));
}

function heuristicDraft(goal: string): LlmTaskDraft[] {
    const lowerGoal = goal.toLowerCase();
    const totalDays = extractTimeframeDays(goal) ?? 7; // default window
    
    // Moving/Relocation goals
    if (lowerGoal.includes('move') || lowerGoal.includes('apartment') || lowerGoal.includes('house') || lowerGoal.includes('relocate')) {
        return [
            { title: "Research neighborhoods and find new place", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "high" },
            { title: "Visit properties and make decision", durationDays: Math.max(1, Math.floor(totalDays * 0.15)), priority: "high" },
            { title: "Give notice to current landlord", durationDays: 1, priority: "high" },
            { title: "Pack belongings and organize", durationDays: Math.max(1, Math.floor(totalDays * 0.25)), priority: "medium" },
            { title: "Arrange moving truck/help", durationDays: 1, priority: "medium" },
            { title: "Transfer utilities and change address", durationDays: 1, priority: "high" },
            { title: "Move belongings to new place", durationDays: 1, priority: "high" },
            { title: "Unpack and settle in", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "medium" }
        ];
    }
    
    // Academic/Study goals
    if (lowerGoal.includes('exam') || lowerGoal.includes('test') || lowerGoal.includes('study') || lowerGoal.includes('homework')) {
        return [
            { title: "Review syllabus and exam format", durationDays: 1, priority: "high" },
            { title: "Create study schedule", durationDays: 1, priority: "high" },
            { title: "Review key concepts and notes", durationDays: Math.max(1, Math.floor(totalDays * 0.4)), priority: "high" },
            { title: "Practice problems and past papers", durationDays: Math.max(1, Math.floor(totalDays * 0.3)), priority: "medium" },
            { title: "Final review and memorization", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "high" },
            { title: "Rest and prepare for exam day", durationDays: 1, priority: "medium" }
        ];
    }
    
    // Fitness/Health goals
    if (lowerGoal.includes('fit') || lowerGoal.includes('exercise') || lowerGoal.includes('gym') || lowerGoal.includes('workout') || lowerGoal.includes('weight')) {
        return [
            { title: "Assess current fitness level", durationDays: 1, priority: "high" },
            { title: "Create workout plan and schedule", durationDays: 1, priority: "high" },
            { title: "Set up home gym or gym membership", durationDays: 1, priority: "medium" },
            { title: "Start regular exercise routine", durationDays: Math.max(1, Math.floor(totalDays * 0.6)), priority: "high" },
            { title: "Track progress and adjust plan", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "medium" },
            { title: "Maintain healthy diet", durationDays: Math.max(1, Math.floor(totalDays * 0.1)), priority: "medium" }
        ];
    }
    
    // Business/Product goals
    if (lowerGoal.includes('launch') || lowerGoal.includes('product') || lowerGoal.includes('business') || lowerGoal.includes('app') || lowerGoal.includes('startup')) {
        return [
            { title: "Define requirements and scope", durationDays: Math.max(1, Math.floor(totalDays * 0.1)), priority: "high" },
            { title: "Design and prototype", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "high" },
            { title: "Development and implementation", durationDays: Math.max(1, Math.floor(totalDays * 0.4)), priority: "medium" },
            { title: "Testing and bug fixes", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "medium" },
            { title: "Launch preparation and marketing", durationDays: Math.max(1, Math.floor(totalDays * 0.1)), priority: "high" }
        ];
    }
    
    // Learning/Skill goals
    if (lowerGoal.includes('learn') || lowerGoal.includes('course') || lowerGoal.includes('skill') || lowerGoal.includes('language')) {
        return [
            { title: "Research learning resources", durationDays: 1, priority: "high" },
            { title: "Set up learning environment", durationDays: 1, priority: "medium" },
            { title: "Create study schedule", durationDays: 1, priority: "high" },
            { title: "Begin learning and practice", durationDays: Math.max(1, Math.floor(totalDays * 0.6)), priority: "high" },
            { title: "Practice and apply skills", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "medium" },
            { title: "Test knowledge and review", durationDays: Math.max(1, Math.floor(totalDays * 0.1)), priority: "high" }
        ];
    }
    
    // Travel goals
    if (lowerGoal.includes('travel') || lowerGoal.includes('trip') || lowerGoal.includes('vacation') || lowerGoal.includes('holiday')) {
        return [
            { title: "Research destination and plan itinerary", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "high" },
            { title: "Book flights and accommodation", durationDays: 1, priority: "high" },
            { title: "Apply for visas/passport if needed", durationDays: Math.max(1, Math.floor(totalDays * 0.1)), priority: "high" },
            { title: "Plan activities and make reservations", durationDays: Math.max(1, Math.floor(totalDays * 0.15)), priority: "medium" },
            { title: "Pack and prepare for trip", durationDays: Math.max(1, Math.floor(totalDays * 0.1)), priority: "medium" },
            { title: "Travel and enjoy the trip", durationDays: Math.max(1, Math.floor(totalDays * 0.4)), priority: "high" },
            { title: "Return and organize memories", durationDays: Math.max(1, Math.floor(totalDays * 0.05)), priority: "low" }
        ];
    }
    
    // Generic project breakdown (fallback)
    return [
        { title: "Plan and research", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "high" },
        { title: "Prepare resources", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "high" },
        { title: "Execute main work", durationDays: Math.max(1, Math.floor(totalDays * 0.4)), priority: "medium" },
        { title: "Review and finalize", durationDays: Math.max(1, Math.floor(totalDays * 0.2)), priority: "high" }
    ];
}

export async function planTasks(goal: string): Promise<TaskItem[]> {
    const llm = await generateWithLlm(goal);
    const drafts: LlmTaskDraft[] = llm ?? heuristicDraft(goal);

    // Normalize and assign ids, map dependencies by title to ids
    const tasks: TaskItem[] = drafts.map(d => ({
        id: randomUUID(),
        title: d.title,
        description: d.description ?? "",
        durationDays: Math.max(1, Math.ceil(d.durationDays ?? 1)),
        dependsOnIds: [],
        priority: d.priority ?? "medium",
    }));

    const titleToId = new Map<string, string>();
    tasks.forEach(t => titleToId.set(t.title.toLowerCase(), t.id));
    tasks.forEach((t, i) => {
        const src = drafts[i]!;
        const deps = src.dependsOnTitles ?? [];
        t.dependsOnIds = deps
            .map(name => titleToId.get(name.toLowerCase()))
            .filter((id): id is string => Boolean(id));
    });

    // If a timeframe exists, scale durations to fit exactly that many days
    const timeframeDays = extractTimeframeDays(goal);
    if (timeframeDays && tasks.length > 0) {
        const currentTotal = tasks.reduce((sum, t) => sum + t.durationDays, 0);
        if (currentTotal !== timeframeDays) {
            const factor = timeframeDays / currentTotal;
            let adjustedTotal = 0;
            for (const t of tasks) {
                t.durationDays = Math.max(1, Math.round(t.durationDays * factor));
                adjustedTotal += t.durationDays;
            }
            // Nudge last task to fix rounding drift
            const drift = timeframeDays - adjustedTotal;
            if (drift !== 0) {
                tasks[tasks.length - 1]!.durationDays = Math.max(1, tasks[tasks.length - 1]!.durationDays + drift);
            }
        }
    }

    // If no dependencies provided at all, create a simple sequential chain
    const hasAnyDeps = tasks.some(t => t.dependsOnIds.length > 0);
    if (!hasAnyDeps) {
        for (let i = 1; i < tasks.length; i++) {
            tasks[i]!.dependsOnIds = [tasks[i - 1]!.id];
        }
    }

    return tasks;
}

