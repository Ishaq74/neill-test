import { PrismaClient } from '@prisma/client';

// Environment-specific Prisma client configuration
const getDBConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isNeonDev = isDevelopment && process.env.DATABASE_URL?.includes('neon.tech');
  
  // Neon-specific configuration for development
  if (isNeonDev) {
    return {
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Neon serverless optimizations
      log: ['warn', 'error'] as const
    };
  }
  
  // Production PostgreSQL or local development configuration
  return {
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    log: isDevelopment ? ['query', 'info', 'warn', 'error'] as const : ['warn', 'error'] as const
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