#!/usr/bin/env node

/**
 * Auto-migration and seeding script for Railway deployment
 * This script runs database migrations and seeds data automatically on startup
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('[Migration] Starting database migration and seeding...');

try {
  // Step 1: Run database migrations
  console.log('[Migration] Running drizzle-kit generate...');
  execSync('pnpm drizzle-kit generate', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env
  });

  console.log('[Migration] Running drizzle-kit migrate...');
  execSync('pnpm drizzle-kit migrate', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env
  });

  console.log('[Migration] ✅ Database migrations completed successfully');

  // Step 2: Run seed script
  console.log('[Migration] Running seed script...');
  execSync('node drizzle/seed.mjs', {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env
  });

  console.log('[Migration] ✅ Database seeding completed successfully');
  console.log('[Migration] 🎉 All database setup completed!');

} catch (error) {
  console.error('[Migration] ❌ Error during migration or seeding:', error.message);
  
  // Don't exit with error code - allow server to start even if seeding fails
  // (seeding might fail if data already exists)
  console.log('[Migration] ⚠️ Continuing with server startup...');
}
