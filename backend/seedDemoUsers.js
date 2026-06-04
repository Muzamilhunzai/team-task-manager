import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const { Client } = pg;

const USERS = [
  { username: 'Admin Demo', email: 'admin@example.com', role: 'admin' },
  { username: 'User Demo', email: 'user@example.com', role: 'user' },
  { username: 'Demo Admin', email: 'admin-demo@example.com', role: 'admin' },
  { username: 'Demo User', email: 'demo@example.com', role: 'user' },
];

const PASSWORD_PLAIN = 'password123';

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    for (const u of USERS) {
      const hashed = await bcrypt.hash(PASSWORD_PLAIN, 10);

      // Upsert by email
      await client.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE
         SET username = EXCLUDED.username,
             password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role`,
        [u.username, u.email, hashed, u.role]
      );

      console.log(`Seeded ${u.role}: ${u.email}`);
    }
  } finally {
    await client.end();
  }
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});

