#!/usr/bin/env node
/**
 * Database Environment Setup Script
 * 
 * This script helps set up the correct database configuration for development and production:
 * - Development: Neon serverless database
 * - Production: PostgreSQL with Prisma
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

function updateEnvForDevelopment(neonUrl) {
  const envContent = `# Database Configuration - DEVELOPMENT MODE (Neon)
DATABASE_URL="${neonUrl}"
NODE_ENV="development"

# Better Auth
BETTER_AUTH_SECRET="your-development-secret-key-here-32-chars-min"
BETTER_AUTH_URL="http://localhost:4321"
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Development environment configured with Neon database');
  console.log('📝 Don\'t forget to:');
  console.log('   1. Replace your-development-secret-key with a real secret (32+ characters)');
  console.log('   2. Run: npm run db:generate');
  console.log('   3. Run: npm run db:push (for development)');
}

function updateEnvForProduction(postgresUrl) {
  const envContent = `# Database Configuration - PRODUCTION MODE (PostgreSQL)
DATABASE_URL="${postgresUrl}"
NODE_ENV="production"

# Better Auth
BETTER_AUTH_SECRET="your-production-secret-key-here-32-chars-min"
BETTER_AUTH_URL="https://your-domain.com"
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Production environment configured with PostgreSQL');
  console.log('📝 Don\'t forget to:');
  console.log('   1. Replace your-production-secret-key with a real secret (32+ characters)');
  console.log('   2. Update BETTER_AUTH_URL with your domain');
  console.log('   3. Run: npm run db:generate');
  console.log('   4. Run: npm run db:migrate (for production)');
}

function showUsage() {
  console.log(`
🗃️  Database Environment Setup Tool

Usage:
  node scripts/setup-db-env.js dev <neon-url>     # Set up development with Neon
  node scripts/setup-db-env.js prod <postgres-url> # Set up production with PostgreSQL
  node scripts/setup-db-env.js help               # Show this help

Examples:
  # Development with Neon
  node scripts/setup-db-env.js dev "postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require"
  
  # Production with PostgreSQL
  node scripts/setup-db-env.js prod "postgresql://username:password@localhost:5432/database_name"

ℹ️  Current setup:
  - Development: Neon serverless database (optimized for preview deployments)
  - Production: PostgreSQL with Prisma (full-featured, persistent database)
`);
}

// Main script logic
const [,, command, dbUrl] = process.argv;

switch (command) {
  case 'dev':
  case 'development':
    if (!dbUrl) {
      console.error('❌ Error: Neon database URL is required');
      console.log('Example: node scripts/setup-db-env.js dev "postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"');
      process.exit(1);
    }
    if (!dbUrl.includes('neon.tech')) {
      console.warn('⚠️  Warning: The provided URL doesn\'t appear to be a Neon URL');
    }
    updateEnvForDevelopment(dbUrl);
    break;

  case 'prod':
  case 'production':
    if (!dbUrl) {
      console.error('❌ Error: PostgreSQL database URL is required');
      console.log('Example: node scripts/setup-db-env.js prod "postgresql://user:pass@localhost:5432/dbname"');
      process.exit(1);
    }
    updateEnvForProduction(dbUrl);
    break;

  case 'help':
  case '--help':
  case '-h':
    showUsage();
    break;

  default:
    console.error('❌ Error: Invalid command');
    showUsage();
    process.exit(1);
}