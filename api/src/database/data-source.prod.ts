import 'reflect-metadata';
import 'dotenv/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';

// Resolved relative to the compiled file: dist/database/data-source.prod.js
const distDir = join(dirname(fileURLToPath(import.meta.url)), '..');

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  entities: [join(distDir, '**', '*.entity.js')],
  migrations: [join(distDir, 'database', 'migrations', '*.js')],
});
