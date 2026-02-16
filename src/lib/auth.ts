import { createHash } from 'crypto';
import prisma from './db';

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** Validate Bearer token, return userId or null */
export async function validateApiKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const raw = authHeader.slice(7);
  const hashed = hashApiKey(raw);
  const apiKey = await prisma.apiKey.findUnique({ where: { key: hashed } });
  return apiKey?.userId ?? null;
}
