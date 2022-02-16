import { PrismaClient } from '@prisma/client';
import { logger } from './api';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient;
}

export const prisma = global.prisma || new PrismaClient();

// Only initialize once
if (!global.prisma) {
  prisma.$use(async (params, next) => {
    const before = Date.now();

    const result = await next(params);

    const after = Date.now();

    logger.info(
      `[Prisma] Query ${params.model}.${params.action} took ${
        after - before
      }ms `
    );

    return result;
  });
}

if (process.env.NODE_ENV === 'development') global.prisma = prisma;
