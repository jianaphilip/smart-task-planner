export interface LlmTaskDraft {
    title: string;
    description?: string;
    dependsOnTitles?: string[];
    durationDays?: number;
    priority?: "high" | "medium" | "low";
}
export declare function generateWithLlm(goal: string): Promise<LlmTaskDraft[] | null>;
//# sourceMappingURL=llm.d.ts.map