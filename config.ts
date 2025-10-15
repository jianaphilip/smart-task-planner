import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: Number(process.env.PORT ?? 3000),
    openAiApiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    allowHeuristicFallback: (process.env.ALLOW_FALLBACK ?? "true").toLowerCase() !== "false",
};

export function assertConfig(): void {
    if (!config.openAiApiKey && !config.allowHeuristicFallback) {
        throw new Error("OPENAI_API_KEY is missing and heuristic fallback disabled; cannot generate plans.");
    }
}

