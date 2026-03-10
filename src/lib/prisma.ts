import { PrismaClient } from "@prisma/client";

// Avoid creating multiple PrismaClient instances during hot-reloads in dev.
// In production there's only one instance anyway.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
