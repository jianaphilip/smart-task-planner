"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./utils/config");
const plan_1 = require("./routes/plan");
(0, config_1.assertConfig)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", plan_1.planRouter);
app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
app.get("/", (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../public/index.html"));
});
app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(config_1.config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Smart Task Planner listening on http://localhost:${config_1.config.port}`);
});
//# sourceMappingURL=index.js.map