export type Priority = "high" | "medium" | "low";

export interface TaskItem {
    id: string;
    title: string;
    description: string;
    durationDays: number; // estimated duration in days
    startDate?: string; // ISO date
    endDate?: string; // ISO date
    dependsOnIds: string[];
    priority: Priority;
    owner?: string;
}

export interface PlanRequestBody {
    goal: string;
    horizonDays?: number; // default based on goal hint
    startDate?: string; // ISO date to start planning from
}

export interface PlanResponseBody {
    goal: string;
    tasks: TaskItem[];
    timeline: {
        startDate: string;
        endDate: string;
        totalDays: number;
    };
}

