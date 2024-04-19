import express from 'express';
import fs from 'fs';
import { handleFunctionError } from '../utils/sharedUtils';

const apiKeys: string[] = loadApiKeys('./config/keys.json');

export function loadApiKeys(filePath: string): string[] {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const apiKeys = JSON.parse(data).apiKeys;
    return apiKeys;
  } catch (error) {
    if (error instanceof Error) {
      handleFunctionError(
        'app',
        'loadApiKeys',
        `Caught an error: ${error.message}`,
      );
    }
    return [];
  }
}

export function checkAuthorization(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const apiKey = req.query.key as string;

  if (!apiKeys.includes(apiKey)) {
    res.status(401).json({ message: 'Invalid API key' });
  } else {
    next();
  }
}
