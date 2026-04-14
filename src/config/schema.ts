import { z } from 'zod';

export const EndpointSchema = z.object({
  name: z.string().min(1, 'Endpoint name is required'),
  url: z.string().url('Must be a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
  thresholds: z.object({
    responseTimeMs: z.number().positive().default(2000),
    statusCode: z.number().int().min(100).max(599).default(200),
  }).default({}),
  interval: z.number().positive().default(60),
});

export const ConfigSchema = z.object({
  version: z.literal('1').default('1'),
  endpoints: z.array(EndpointSchema).min(1, 'At least one endpoint is required'),
  alerting: z.object({
    onSlack: z.string().url().optional(),
    onConsole: z.boolean().default(true),
  }).default({}),
});

export type Endpoint = z.infer<typeof EndpointSchema>;
export type Config = z.infer<typeof ConfigSchema>;
