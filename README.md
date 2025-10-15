# Smart Task Planner

Break user goals into actionable tasks with dependencies and timelines using AI reasoning.

## Features
- Backend API `POST /api/plan` to generate a plan from goal text
- LLM reasoning via OpenAI (with heuristic fallback if no API key)
- Simple frontend to submit a goal and view the plan

## Getting Started

### Prerequisites
- Node.js 18+ (for built-in fetch and modern syntax)

### Setup
```bash
git clone <your-repo-url>
cd smart-task-planner
npm install
```

Create `.env` in the project root:
```bash
PORT=3000
OPENAI_API_KEY=sk-... # optional; leave empty to use heuristic fallback
OPENAI_MODEL=gpt-4o-mini
ALLOW_FALLBACK=true
```

### Run
```bash
npm run dev
# open http://localhost:3000
```

### Build & Start
```bash
npm run build
npm start
```

## API

### POST /api/plan
Request body:
```json
{ "goal": "Launch a product in 2 weeks", "startDate": "2025-10-15" }
```

Response body:
```json
{
  "goal": "Launch a product in 2 weeks",
  "tasks": [
    {
      "id": "...",
      "title": "Clarify scope & success metrics",
      "description": "",
      "durationDays": 1,
      "startDate": "2025-10-15",
      "endDate": "2025-10-16",
      "dependsOnIds": [],
      "priority": "high"
    }
  ],
  "timeline": { "startDate": "2025-10-15", "endDate": "2025-10-29", "totalDays": 14 }
}
```

## Implementation Notes
- If `OPENAI_API_KEY` is set, the backend asks the LLM to produce tasks as JSON.
- If not, a heuristic set of tasks/phases is generated and scheduled.
- Tasks are scheduled with a simple dependency-aware algorithm.

## Demo Video Guidance
- Show entering a goal, generating the plan, and reviewing dependencies & dates
- Briefly show the code structure and API response in the browser devtools

## License
MIT


