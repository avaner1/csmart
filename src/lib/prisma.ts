import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return new Proxy({} as PrismaClient, {
      get(_, prop) {
        if (prop === "then") return undefined;
        return () => { throw new Error("DATABASE_URL is not set"); };
      },
    });
  }

  const poolConfig: Record<string, unknown> = {};

  // Cloud SQL Unix socket format: ?host=/cloudsql/...
  const hostMatch = connectionString.match(/[?&]host=([^&]+)/);
  if (hostMatch && hostMatch[1].startsWith("/cloudsql")) {
    const url = new URL(connectionString.replace(/\?host=.*$/, ""));
    poolConfig.user = url.username;
    poolConfig.password = url.password;
    poolConfig.database = url.pathname.slice(1);
    poolConfig.host = hostMatch[1];
  } else {
    poolConfig.connectionString = connectionString;
    if (connectionString.includes("sslmode=require") || connectionString.includes("neon.tech")) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
  }

  const pool = new Pool(poolConfig);
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
