/**
 * Background Job Worker
 *
 * Run with: npx tsx scripts/worker.ts
 *
 * This script runs as a separate process from the Next.js app
 * and processes jobs from the database queue.
 */

import { getDb } from "../src/lib/db";
import { createWorker } from "../src/lib/jobs/worker";
import { jobHandlers } from "../src/lib/jobs/handlers";

// Load environment variables
import "dotenv/config";

async function main() {
  console.log("Starting PAYGSite Job Worker...");

  // Initialize database connection
  const db = getDb();

  // Create worker with all handlers
  const worker = createWorker(db, jobHandlers, {
    pollInterval: 5000, // 5 seconds when idle
    busyInterval: 100, // 100ms when processing
    concurrency: 2, // Process 2 jobs at a time
    verbose: true,
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log("\nReceived shutdown signal...");
    await worker.stop();
    await db.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Start processing
  await worker.start();

  // Keep process running
  console.log("Worker is running. Press Ctrl+C to stop.");
}

main().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
