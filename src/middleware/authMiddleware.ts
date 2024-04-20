import express from 'express';
import fs from 'fs';
import { handleFunctionError, handleRouteError } from '../utils/sharedUtils';
import { checkAuthorizationQuerySchema } from '../zod';

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

export async function checkAuthorization(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): Promise<void> {
  const validatedQuery = await checkAuthorizationQuerySchema.safeParseAsync(
    req.query,
  );
  if (!validatedQuery.success) {
    handleRouteError(
      res,
      400,
      'access',
      'checkAuthorization',
      JSON.stringify(validatedQuery.error.issues),
    );
    return;
  }
  if (!apiKeys.includes(validatedQuery.data.key)) {
    res.status(401).json({ message: 'Invalid API key' });
  } else {
    next();
  }
}
