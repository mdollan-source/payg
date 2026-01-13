import type { PrismaClient, Job } from "@prisma/client";

export type JobType =
  | "ai_generate_spec"
  | "ai_generate_seed"
  | "import_seed"
  | "send_email"
  | "verify_dns"
  | "provision_ssl";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "dead";

export interface JobPayload {
  tenantId: string;
  [key: string]: unknown;
}

/**
 * Create a new job in the queue
 */
export async function createJob(
  db: PrismaClient,
  {
    tenantId,
    jobType,
    payload,
    runAt,
  }: {
    tenantId: string;
    jobType: JobType;
    payload: JobPayload;
    runAt?: Date;
  }
): Promise<Job> {
  return db.job.create({
    data: {
      tenantId,
      jobType,
      status: "pending",
      payload: payload as object,
      attempts: 0,
      runAt: runAt ?? new Date(),
    },
  });
}

/**
 * Claim a job for processing using SELECT FOR UPDATE SKIP LOCKED
 * This ensures only one worker can claim a job at a time
 */
export async function claimJob(
  db: PrismaClient,
  jobTypes?: JobType[]
): Promise<Job | null> {
  // Use raw query for SKIP LOCKED support
  const jobTypeFilter = jobTypes?.length
    ? `AND job_type IN (${jobTypes.map((t) => `'${t}'`).join(", ")})`
    : "";

  const jobs = await db.$queryRawUnsafe<Job[]>(`
    SELECT * FROM jobs
    WHERE status = 'pending'
    AND run_at <= NOW()
    ${jobTypeFilter}
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `);

  if (jobs.length === 0) {
    return null;
  }

  const job = jobs[0];

  // Update job to running status
  return db.job.update({
    where: { id: job.id },
    data: {
      status: "running",
      startedAt: new Date(),
      attempts: { increment: 1 },
    },
  });
}

/**
 * Mark a job as completed
 */
export async function completeJob(
  db: PrismaClient,
  jobId: string,
  result?: object
): Promise<Job> {
  return db.job.update({
    where: { id: jobId },
    data: {
      status: "completed",
      completedAt: new Date(),
      result: result ?? undefined,
    },
  });
}

/**
 * Mark a job as failed with retry logic
 * Uses exponential backoff: 30s, 2min, 8min, 30min
 */
export async function failJob(
  db: PrismaClient,
  jobId: string,
  error: string,
  currentAttempts: number
): Promise<Job> {
  const maxAttempts = 4;
  const backoffSeconds = [30, 120, 480, 1800]; // 30s, 2min, 8min, 30min

  if (currentAttempts >= maxAttempts) {
    // Move to dead letter queue
    return db.job.update({
      where: { id: jobId },
      data: {
        status: "dead",
        lastError: error,
        completedAt: new Date(),
      },
    });
  }

  // Schedule retry with exponential backoff
  const delaySeconds = backoffSeconds[currentAttempts - 1] || 1800;
  const runAt = new Date(Date.now() + delaySeconds * 1000);

  return db.job.update({
    where: { id: jobId },
    data: {
      status: "pending",
      lastError: error,
      runAt,
    },
  });
}

/**
 * Get jobs for a tenant
 */
export async function getJobsForTenant(
  db: PrismaClient,
  tenantId: string,
  options?: {
    status?: JobStatus;
    jobType?: JobType;
    limit?: number;
  }
): Promise<Job[]> {
  return db.job.findMany({
    where: {
      tenantId,
      ...(options?.status && { status: options.status }),
      ...(options?.jobType && { jobType: options.jobType }),
    },
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 50,
  });
}

/**
 * Get dead jobs for admin review
 */
export async function getDeadJobs(
  db: PrismaClient,
  options?: {
    tenantId?: string;
    limit?: number;
  }
): Promise<Job[]> {
  return db.job.findMany({
    where: {
      status: "dead",
      ...(options?.tenantId && { tenantId: options.tenantId }),
    },
    orderBy: { completedAt: "desc" },
    take: options?.limit ?? 100,
  });
}

/**
 * Retry a dead job (admin action)
 */
export async function retryDeadJob(
  db: PrismaClient,
  jobId: string
): Promise<Job> {
  return db.job.update({
    where: { id: jobId },
    data: {
      status: "pending",
      attempts: 0,
      lastError: null,
      runAt: new Date(),
      startedAt: null,
      completedAt: null,
    },
  });
}

/**
 * Clean up old completed jobs (keep last 30 days)
 */
export async function cleanupOldJobs(db: PrismaClient): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  const result = await db.job.deleteMany({
    where: {
      status: "completed",
      completedAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(db: PrismaClient): Promise<{
  pending: number;
  running: number;
  completed: number;
  failed: number;
  dead: number;
}> {
  const [pending, running, completed, failed, dead] = await Promise.all([
    db.job.count({ where: { status: "pending" } }),
    db.job.count({ where: { status: "running" } }),
    db.job.count({ where: { status: "completed" } }),
    db.job.count({ where: { status: "failed" } }),
    db.job.count({ where: { status: "dead" } }),
  ]);

  return { pending, running, completed, failed, dead };
}
