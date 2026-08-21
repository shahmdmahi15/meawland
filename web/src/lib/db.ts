import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/env";

// 1. Maintain global references to handle Next.js local HMR reloads and connection pooling
const globalForPrisma = global as unknown as {
  db: PrismaClient | undefined;
  pool: Pool | undefined;
};

// 2. Initialize or reuse the pg connection pool
const pool =
  globalForPrisma.pool ||
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

// 3. Initialize the PostgreSQL adapter with the pool instance
const adapter = new PrismaPg(pool);

// 4. Initialize or reuse the Prisma Client with the configured driver adapter
const db =
  globalForPrisma.db ||
  new PrismaClient({
    adapter,
  });

// 5. Cache the instances globally outside of production environments
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
  globalForPrisma.pool = pool;
}

export default db;
