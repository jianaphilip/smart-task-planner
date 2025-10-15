import express from "express";
import cors from "cors";
import path from "path";
import { config, assertConfig } from "./utils/config";
import { planRouter } from "./routes/plan";
import taskRouter from "./routes/tasks";
import "./database/schema"; // Initialize database

assertConfig();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", planRouter);
app.use("/api", taskRouter);

app.use(express.static(path.join(__dirname, "../public")));
app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Smart Task Planner listening on http://localhost:${config.port}`);
});


