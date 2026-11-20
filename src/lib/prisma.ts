import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

let prisma: PrismaClient | undefined;

export function getPrismaClient() {
  if (prisma) {
    return prisma;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  const adapter = new PrismaMariaDb(databaseUrl);
  prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}
