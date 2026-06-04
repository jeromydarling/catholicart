// Thin convenience helpers over the D1 client.

import type { D1Database } from '@cloudflare/workers-types';

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(prefix = 'id'): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
}

export async function first<T>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  return (await db.prepare(sql).bind(...params).first()) as T | null;
}

export async function all<T>(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const { results } = await db.prepare(sql).bind(...params).all<T>();
  return results ?? [];
}

export async function run(
  db: D1Database,
  sql: string,
  ...params: unknown[]
): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run();
}

export interface D1Result {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
}
