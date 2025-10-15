import { config } from "../utils/config";

export interface LlmTaskDraft {
    title: string;
    description?: string;
    dependsOnTitles?: string[];
    durationDays?: number;
    priority?: "high" | "medium" | "low";
}

export async function generateWithLlm(goal: string): Promise<LlmTaskDraft[] | null> {
    if (!config.openAiApiKey) return null;

    const system = `You are an expert project planner and life coach. Analyze the user's goal and create a realistic, context-appropriate task breakdown.

CRITICAL RULES:
1. RESPECT EXACT TIMEFRAMES: If goal mentions "5 days", "2 weeks", "1 month" - create tasks that fit EXACTLY that duration
2. BE CONTEXT-AWARE: Create tasks specific to the goal type:
   - Moving/Relocation: research neighborhoods, visit properties, pack, arrange movers, transfer utilities, unpack
   - Academic/Study: review materials, create schedule, study concepts, practice, review, rest
   - Fitness/Health: assess current state, create plan, set up resources, exercise routine, track progress
   - Business/Product: define requirements, design, develop, test, launch
   - Learning/Skills: research resources, set up environment, learn, practice, test knowledge
   - Travel: research destination, book flights/hotels, plan activities, pack, travel, return
   - Personal: break into practical, actionable steps relevant to the specific goal

3. REALISTIC DURATIONS: Each task should have reasonable duration (1+ days)
4. LOGICAL DEPENDENCIES: Tasks should depend on previous tasks when it makes sense
5. PRIORITIES: Assign high/medium/low based on importance and urgency
6. TOTAL DURATION: Sum of all task durations must equal the stated timeframe

Output as JSON array with fields: title, description, dependsOnTitles, durationDays, priority.

Example for "move to new apartment in 2 weeks":
[
  {"title": "Research neighborhoods and find options", "description": "Look online and visit areas", "durationDays": 3, "priority": "high"},
  {"title": "Visit properties and make decision", "description": "Tour apartments and choose one", "durationDays": 2, "priority": "high", "dependsOnTitles": ["Research neighborhoods and find options"]},
  {"title": "Give notice to current landlord", "description": "Submit written notice", "durationDays": 1, "priority": "high"},
  {"title": "Pack belongings", "description": "Organize and box up items", "durationDays": 4, "priority": "medium"},
  {"title": "Arrange moving truck", "description": "Book movers or rent truck", "durationDays": 1, "priority": "medium"},
  {"title": "Transfer utilities", "description": "Set up new services and cancel old", "durationDays": 1, "priority": "high"},
  {"title": "Move belongings", "description": "Transport items to new place", "durationDays": 1, "priority": "high"},
  {"title": "Unpack and settle in", "description": "Organize new space", "durationDays": 2, "priority": "medium"}
]`;
    const user = `Goal: ${goal}`;

    try {
        // OpenAI responses can be called via the new responses API if available; fallback to chat completions-compatible route
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${config.openAiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: user }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });
        if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
        const data = await res.json() as any;
        const content: string = data.choices?.[0]?.message?.content ?? "";
        let parsed: any;
        try {
            parsed = JSON.parse(content);
        } catch {
            // sometimes response_format may not be honored strictly; try to extract JSON array
            const match = content.match(/\[[\s\S]*\]/);
            parsed = match ? JSON.parse(match[0]) : null;
        }
        if (!parsed) return null;
        const arr = Array.isArray(parsed) ? parsed : parsed.tasks ?? parsed.plan ?? null;
        if (!arr || !Array.isArray(arr)) return null;
        return arr as LlmTaskDraft[];
    } catch {
        return null;
    }
}

