import { Response } from 'express';
import Logger from './logger';

export function handleRouteError(res: Response, statusCode: number, logType: string, routeName: string, message: string): void {
    Logger.error(logType, `[${statusCode}] [${routeName}] | ${message}`);
    res.status(statusCode).json({ error: message });
}

export function handleFunctionError(logType: string, functionName: string, message: string): void {
    Logger.error(logType, `[${functionName}] | ${message}`);
}
