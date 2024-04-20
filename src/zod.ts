import { z } from 'zod';
import { config } from './config';

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
    .refine((value) => value >= 0 && value <= config.maxAbPrecision, {
      message: 'abPrecision must be >= 0 and <= ' + config.maxAbPrecision,
    })
    .optional(),
  confPrecision: z
    .string()
    .min(1)
    .max(100)
    .regex(/^\d+$/)
    .transform((value) => parseInt(value))
    .refine((value) => value >= 0 && value <= config.maxConfPrecision, {
      message: 'confPrecision must be >= 0 and <= ' + config.maxConfPrecision,
    })
    .optional(),
  maxTimestampDiff: z
    .string()
    .min(1)
    .max(100)
    .regex(/^\d+$/)
    .transform((value) => parseInt(value))
    .refine((value) => value >= 0 && value <= config.maxMaxTimestampDiff, {
      message:
        'maxTimestampDiff must be >= 0 and <= ' + config.maxMaxTimestampDiff,
    })
    .optional(),
});
