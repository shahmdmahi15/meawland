import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/env";

// 1. Maintain a global structure definition to handle Next.js local HMR reloads
const globalForPrisma = global as unknown as {
  db: PrismaClient | undefined;
};

// 2. Initialize the PostgreSQL adapter matching your environment schema pattern
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

// 3. Initialize or reuse the Prisma Client with the configured driver adapter
const db =
  globalForPrisma.db ||
  new PrismaClient({
    adapter,
  });

// 4. Cache the instance globally if we are working outside of production environments
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.db = db;
}

export default db;
