import cron from "node-cron";

import { runOrderMonitorJob } from "./order-monitor.job.js";

console.log("[JOB RUNNER] Background job runner started");

cron.schedule("*/5 * * * *", async () => {
  await runOrderMonitorJob();
});

console.log(
  "[JOB RUNNER] Order monitor scheduled → every 5 minutes",
);