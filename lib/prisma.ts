import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  pgPool?: Pool
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

function envNumber(name: string, fallback: number) {
  const raw = process.env[name]
  if (!raw) return fallback
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString,
    // Supabase "session mode" poolers can hit client limits fast in Next dev.
    // Keep this low unless you know you need more.
    max: envNumber("PG_POOL_MAX", 2),
    idleTimeoutMillis: envNumber("PG_POOL_IDLE_TIMEOUT_MS", 10_000),
    connectionTimeoutMillis: envNumber("PG_POOL_CONNECTION_TIMEOUT_MS", 10_000),
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool
}

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}