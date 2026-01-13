import type { PrismaClient, Job } from "@prisma/client";
import { claimJob, completeJob, failJob, type JobType } from "./queue";

export type JobHandler = (
  job: Job,
  db: PrismaClient
) => Promise<object | void>;

export interface WorkerOptions {
  /**
   * Job types this worker handles (all if not specified)
   */
  jobTypes?: JobType[];
  /**
   * Polling interval in ms when queue is empty (default: 5000)
   */
  pollInterval?: number;
  /**
   * Minimum polling interval when busy (default: 100)
   */
  busyInterval?: number;
  /**
   * Maximum concurrent jobs (default: 1)
   */
  concurrency?: number;
  /**
   * Whether to log job processing (default: true)
   */
  verbose?: boolean;
}

export class JobWorker {
  private db: PrismaClient;
  private handlers: Map<string, JobHandler>;
  private options: Required<WorkerOptions>;
  private running: boolean = false;
  private activeJobs: number = 0;

  constructor(db: PrismaClient, options: WorkerOptions = {}) {
    this.db = db;
    this.handlers = new Map();
    this.options = {
      jobTypes: options.jobTypes ?? [],
      pollInterval: options.pollInterval ?? 5000,
      busyInterval: options.busyInterval ?? 100,
      concurrency: options.concurrency ?? 1,
      verbose: options.verbose ?? true,
    };
  }

  /**
   * Register a handler for a job type
   */
  register(jobType: JobType, handler: JobHandler): this {
    this.handlers.set(jobType, handler);
    return this;
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.running) {
      console.warn("Worker is already running");
      return;
    }

    this.running = true;
    this.log("Worker started");

    // Start polling loop
    this.poll();
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    this.running = false;
    this.log("Worker stopping...");

    // Wait for active jobs to complete
    while (this.activeJobs > 0) {
      await this.sleep(100);
    }

    this.log("Worker stopped");
  }

  /**
   * Main polling loop
   */
  private async poll(): Promise<void> {
    while (this.running) {
      // Check if we can take more jobs
      if (this.activeJobs >= this.options.concurrency) {
        await this.sleep(this.options.busyInterval);
        continue;
      }

      try {
        const job = await claimJob(
          this.db,
          this.options.jobTypes.length > 0 ? this.options.jobTypes : undefined
        );

        if (job) {
          // Process job asynchronously
          this.processJob(job);
          // Quick poll for more work
          await this.sleep(this.options.busyInterval);
        } else {
          // No work, use longer poll interval
          await this.sleep(this.options.pollInterval);
        }
      } catch (error) {
        console.error("Error claiming job:", error);
        await this.sleep(this.options.pollInterval);
      }
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    this.activeJobs++;
    const startTime = Date.now();

    this.log(`Processing job ${job.id} (${job.jobType})`);

    const handler = this.handlers.get(job.jobType);

    if (!handler) {
      console.error(`No handler registered for job type: ${job.jobType}`);
      await failJob(
        this.db,
        job.id,
        `No handler for job type: ${job.jobType}`,
        job.attempts
      );
      this.activeJobs--;
      return;
    }

    try {
      const result = await handler(job, this.db);
      await completeJob(this.db, job.id, result as object | undefined);

      const duration = Date.now() - startTime;
      this.log(`Completed job ${job.id} in ${duration}ms`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Job ${job.id} failed:`, errorMessage);

      await failJob(this.db, job.id, errorMessage, job.attempts);

      if (job.attempts >= 4) {
        this.log(`Job ${job.id} moved to dead letter queue after ${job.attempts} attempts`);
      } else {
        this.log(`Job ${job.id} scheduled for retry (attempt ${job.attempts})`);
      }
    } finally {
      this.activeJobs--;
    }
  }

  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[Worker] ${new Date().toISOString()} - ${message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a worker with common handlers pre-registered
 */
export function createWorker(
  db: PrismaClient,
  handlers: Partial<Record<JobType, JobHandler>>,
  options?: WorkerOptions
): JobWorker {
  const worker = new JobWorker(db, options);

  for (const [jobType, handler] of Object.entries(handlers)) {
    if (handler) {
      worker.register(jobType as JobType, handler);
    }
  }

  return worker;
}
