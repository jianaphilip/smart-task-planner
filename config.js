"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.assertConfig = assertConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: Number(process.env.PORT ?? 3000),
    openAiApiKey: process.env.OPENAI_API_KEY ?? "",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    allowHeuristicFallback: (process.env.ALLOW_FALLBACK ?? "true").toLowerCase() !== "false",
};
function assertConfig() {
    if (!exports.config.openAiApiKey && !exports.config.allowHeuristicFallback) {
        throw new Error("OPENAI_API_KEY is missing and heuristic fallback disabled; cannot generate plans.");
    }
}
//# sourceMappingURL=config.js.map