import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Done.');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
