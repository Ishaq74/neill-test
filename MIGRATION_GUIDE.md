# Database and Authentication Migration Guide

This project has been migrated from SQLite + custom authentication to **PostgreSQL + Prisma + better-auth**.

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database instance
2. **Node.js 18+** and **npm**

## Setup Instructions

### 1. Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Better Auth
BETTER_AUTH_SECRET="your-32-character-secret-key-here"
BETTER_AUTH_URL="http://localhost:4321"
```

### 2. Database Setup

Generate the Prisma client:
```bash
npm run db:generate
```

Push the database schema (for development):
```bash
npm run db:push
```

Or create and run migrations (for production):
```bash
npm run db:migrate
```

Seed the database with initial data:
```bash
npm run db:seed
```

### 3. Development

Start the development server:
```bash
npm run dev
```

## What Changed

### Database Migration
- **Before**: SQLite with better-sqlite3
- **After**: PostgreSQL with Prisma ORM

### Authentication Migration
- **Before**: Custom auth with bcryptjs and simple middleware
- **After**: better-auth with admin plugin and proper session management

### Updated Files

#### Core Infrastructure
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Database seeding script
- `src/lib/db.ts` - Database client (now uses Prisma)
- `src/lib/auth.ts` - better-auth server configuration
- `src/lib/auth-client.ts` - Client-side auth utilities

#### Authentication
- `src/middleware/auth.ts` - Updated to use better-auth sessions
- `src/pages/api/auth/[...all].ts` - better-auth API handler
- `src/pages/api/logout.ts` - Updated logout handler

#### API Routes (All updated to use Prisma)
- `src/pages/api/utilisateur-db.ts`
- `src/pages/api/service-db.ts`
- `src/pages/api/formation-db.ts`
- `src/pages/api/reservation-db.ts`
- `src/pages/api/avis-db.ts`
- `src/pages/api/galerie-db.ts`
- `src/pages/api/facture-db.ts`
- `src/pages/api/admin-block.ts`
- `src/pages/api/faq-db.ts`

## Database Schema

The Prisma schema includes the following models:

### Core Models
- **User** (`utilisateurs` table) - Users and admins
- **Service** (`services` table) - Service offerings
- **Formation** (`formations` table) - Training courses
- **Reservation** (`reservations` table) - Bookings
- **Facture** (`factures` table) - Invoices

### Content Models
- **Galerie** (`galerie` table) - Image gallery
- **Avis** (`avis` table) - Reviews/testimonials
- **Faq** (`faq` table) - Frequently asked questions
- **SiteIdentity** (`site_identity` table) - Site configuration
- **Team** (`team` table) - Team members
- **BlockedSlot** (`blocked_slots` table) - Blocked calendar slots

### Auth Models (better-auth)
- **Account** (`accounts` table) - OAuth accounts
- **Session** (`sessions` table) - User sessions
- **VerificationToken** (`verification_tokens` table) - Email verification

## Authentication Usage

### Server-side (API Routes)
```typescript
import { auth } from '../lib/auth';

// Get session in API route
const session = await auth.api.getSession({ headers: request.headers });
if (!session?.user) {
  return new Response('Unauthorized', { status: 401 });
}
```

### Client-side
```typescript
import { signIn, signOut, getSession } from '../lib/auth-client';

// Sign in
await signIn.email({
  email: "user@example.com",
  password: "password"
});

// Get current session
const session = await getSession();

// Sign out
await signOut();
```

## Database Operations

### Using Prisma Client
```typescript
import { db } from '../lib/db';

// Create
const user = await db.user.create({
  data: { nom: 'John', email: 'john@example.com', role: 'client', password: hashedPassword }
});

// Read
const services = await db.service.findMany({
  where: { isActive: 1 },
  include: { avis: true }
});

// Update
await db.service.update({
  where: { id: 1 },
  data: { prix: 150.0 }
});

// Delete
await db.service.delete({ where: { id: 1 } });
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database (dev)
- `npm run db:migrate` - Create and run migrations (prod)
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database (destructive)

## Migration Notes

1. **Data Migration**: The seed script recreates the essential data. If you have existing data you want to preserve, you'll need to export it from SQLite and import it to PostgreSQL.

2. **Environment**: Make sure to set up your PostgreSQL database and update the `DATABASE_URL` in your `.env` file.

3. **Authentication**: better-auth handles session management automatically. Users will need to log in again after the migration.

4. **API Compatibility**: All API endpoints maintain the same interface, so frontend code should continue to work without changes.

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database credentials and permissions

### Prisma Issues
```bash
# Reset and regenerate if schema changes
npm run db:reset
npm run db:generate
npm run db:push
npm run db:seed
```

### Authentication Issues
- Check `BETTER_AUTH_SECRET` is set (32+ characters)
- Verify `BETTER_AUTH_URL` matches your domain
- Clear browser cookies/localStorage after migration

## Production Deployment

1. Set up PostgreSQL database
2. Update environment variables
3. Run migrations: `npm run db:migrate`
4. Seed database: `npm run db:seed`
5. Build and deploy: `npm run build`

The migration is complete and the application should now use PostgreSQL with Prisma for the database and better-auth for authentication.