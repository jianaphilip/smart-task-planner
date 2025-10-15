"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWithLlm = generateWithLlm;
const config_1 = require("../utils/config");
async function generateWithLlm(goal) {
    if (!config_1.config.openAiApiKey)
        return null;
    const system = "You are a project planner. Break goals into actionable, dependency-ordered tasks with reasonable durations (in days) and priorities. Output as JSON array with fields: title, description, dependsOnTitles, durationDays, priority.";
    const user = `Goal: ${goal}`;
    try {
        // OpenAI responses can be called via the new responses API if available; fallback to chat completions-compatible route
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config_1.config.openAiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: config_1.config.model,
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });
        if (!res.ok)
            throw new Error(`LLM HTTP ${res.status}`);
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        let parsed;
        try {
            parsed = JSON.parse(content);
        }
        catch {
            // sometimes response_format may not be honored strictly; try to extract JSON array
            const match = content.match(/\[[\s\S]*\]/);
            parsed = match ? JSON.parse(match[0]) : null;
        }
        if (!parsed)
            return null;
        const arr = Array.isArray(parsed) ? parsed : parsed.tasks ?? parsed.plan ?? null;
        if (!arr || !Array.isArray(arr))
            return null;
        return arr;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=llm.js.map