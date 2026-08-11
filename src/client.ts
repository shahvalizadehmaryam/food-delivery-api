import 'dotenv/config';
import { PrismaClient } from './generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import config from './config/config';

interface CustomNodeJsGlobal {
  prisma?: PrismaClient;
  prismaDatabaseUrl?: string;
}

declare const global: CustomNodeJsGlobal;

const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const prisma =
  config.env === 'development' &&
  global.prisma &&
  global.prismaDatabaseUrl === process.env.DATABASE_URL
    ? global.prisma
    : createPrismaClient();

if (config.env === 'development') {
  global.prisma = prisma;
  global.prismaDatabaseUrl = process.env.DATABASE_URL;
}

export default prisma;
