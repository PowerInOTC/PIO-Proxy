import express from 'express';
import rateLimit from 'express-rate-limit';

export function limiter(
  windowMs: number,
  maxRequests: number,
): express.RequestHandler {
  return rateLimit({
    windowMs: windowMs,
    max: maxRequests,
    keyGenerator: (req) => {
      return req.query.key as string;
    },
    handler: (req, res) => {
      res.status(429).json({ message: 'Too many requests' });
    },
  });
}
