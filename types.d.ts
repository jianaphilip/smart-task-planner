export type Priority = "high" | "medium" | "low";
export interface TaskItem {
    id: string;
    title: string;
    description: string;
    durationDays: number;
    startDate?: string;
    endDate?: string;
    dependsOnIds: string[];
    priority: Priority;
    owner?: string;
}
export interface PlanRequestBody {
    goal: string;
    horizonDays?: number;
    startDate?: string;
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
//# sourceMappingURL=types.d.ts.map