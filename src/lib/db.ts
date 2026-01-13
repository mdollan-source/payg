import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Create a singleton client - initialized lazily
let _prismaClient: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!_prismaClient) {
    _prismaClient = globalForPrisma.prisma ?? createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = _prismaClient;
    }
  }
  return _prismaClient;
}

// Export db as a proxy that lazily initializes the client
export const db = new Proxy({} as PrismaClient, {
  get(_, prop: string) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// For backwards compatibility with code using getDb()
export function getDb(): PrismaClient {
  return getPrismaClient();
}
