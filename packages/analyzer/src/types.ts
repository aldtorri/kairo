import { z } from 'zod';

export const StackSchema = z.object({
  framework: z.enum(['express', 'fastify', 'nextjs', 'unknown']),
  frontend: z.enum(['react', 'vue', 'svelte', 'none', 'unknown']).optional(),
  language: z.enum(['typescript', 'javascript']),
  hasTests: z.boolean(),
});

export const EndpointSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ALL']),
  path: z.string(),
  file: z.string(),
  line: z.number().optional(),
  requiresAuth: z.boolean().optional(),
});

export const RouteSchema = z.object({
  path: z.string(),
  file: z.string(),
  type: z.enum(['page', 'api', 'static']),
});

export const AuthStrategySchema = z.object({
  type: z.enum(['jwt', 'session', 'passport', 'next-auth', 'none', 'unknown']),
  details: z.string().optional(),
});

export const AnalyzerResultSchema = z.object({
  projectPath: z.string(),
  stack: StackSchema,
  routes: z.array(RouteSchema),
  endpoints: z.array(EndpointSchema),
  authStrategy: AuthStrategySchema,
  staticAssets: z.array(z.string()),
});

export type Stack = z.infer<typeof StackSchema>;
export type Endpoint = z.infer<typeof EndpointSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type AuthStrategy = z.infer<typeof AuthStrategySchema>;
export type AnalyzerResult = z.infer<typeof AnalyzerResultSchema>;
