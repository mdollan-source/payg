import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// Create pool and client at module initialization
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
}

const pool = globalForPrisma.pool ?? (connectionString ? new Pool({ connectionString }) : null);
const adapter = pool ? new PrismaPg(pool) : null;

export const db: PrismaClient = globalForPrisma.prisma ?? new PrismaClient({
  adapter: adapter!,
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  if (pool) globalForPrisma.pool = pool;
}

// For backwards compatibility
export function getDb(): PrismaClient {
  return db;
}
