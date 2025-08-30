import { PrismaClient } from '@prisma/client';

// Simple environment-based database configuration
const getDBConfig = () => {
  const dbEnv = process.env.DB_ENV || 'prod';
  
  if (dbEnv === 'dev') {
    // Development environment (Neon serverless optimizations)
    return {
      log: ['warn', 'error'] as const
    };
  }
  
  // Production environment (PostgreSQL with full logging in development)
  return {
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] as const : ['warn', 'error'] as const
  };
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient(getDBConfig());

// Only cache the Prisma client in development to avoid connection issues in serverless environments
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Utility function to slugify strings (kept from original)
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default db;