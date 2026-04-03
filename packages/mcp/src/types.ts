import { z } from 'zod';

export const McpResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.discriminatedUnion('success', [
    z.object({ success: z.literal(true), data: dataSchema }),
    z.object({ success: z.literal(false), error: z.string() }),
  ]);

export type McpResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function ok<T>(data: T): McpResponse<T> {
  return { success: true, data };
}

export function err(error: unknown): McpResponse<never> {
  const message =
    error instanceof Error ? error.message : String(error);
  return { success: false, error: message };
}
