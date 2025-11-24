import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Use non-pooling connection if available (better for Prisma), otherwise fall back to DATABASE_URL
// For Vercel Postgres: POSTGRES_URL_NON_POOLING is the direct connection
const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL

// Check if database URL is set
if (!databaseUrl) {
  console.error('❌ DATABASE_URL or POSTGRES_URL_NON_POOLING is not set!')
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES')))
  throw new Error(
    'DATABASE_URL or POSTGRES_URL_NON_POOLING environment variable is not set. Please check your .env file.'
  )
}

// Validate connection string format
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error(
    `Invalid DATABASE_URL format. Expected postgresql:// or postgres://, but got: ${databaseUrl.substring(0, 20)}...`
  )
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
