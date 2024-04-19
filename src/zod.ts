import { z } from 'zod';

export const checkAuthorizationQuerySchema = z.object({
  key: z.string().min(1).max(512),
});

export const getPairPriceQuerySchema = z.object({
  a: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9.-]+$/),
  b: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9.-]+$/),
  abPrecision: z
    .string()
    .min(1)
    .max(100)
    .regex(/^\d+$/)
    .transform((value) => parseInt(value))
    .optional(),
  confPrecision: z
    .string()
    .min(1)
    .max(100)
    .regex(/^\d+$/)
    .transform((value) => parseInt(value))
    .optional(),
  maxTimestampDiff: z
    .string()
    .min(1)
    .max(100)
    .regex(/^\d+$/)
    .transform((value) => parseInt(value))
    .optional(),
});
