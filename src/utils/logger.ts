import * as fs from 'fs';
import { config } from '../config';

enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
}

class Logger {
    private static logLevel: LogLevel = LogLevel.ERROR;

    public static setLogLevel(levelString: string): void {
        levelString = levelString.toUpperCase();
        const level = LogLevel[levelString as keyof typeof LogLevel];
        if (level !== undefined) {
            Logger.logLevel = level;
        }
    }

    private static getTimestamp(): string {
        const now = new Date();
        return now.toISOString();
    }

    private static getLogFileName(type: string): string {
        const dateStr = Logger.getTimestamp().split('T')[0];
        return `${type}_${dateStr}.log`;
    }

    private static writeToLogFile(logFileName: string, logMessage: string): void {
        const logDirectory = config.logDirectory;
        if (!fs.existsSync(logDirectory)) {
            fs.mkdirSync(logDirectory, { recursive: true });
        }
        fs.appendFileSync(logDirectory + '/' + logFileName, logMessage + '\n', 'utf-8');
    }

    static debug(type: string, message: string): void {
        if (Logger.logLevel <= LogLevel.DEBUG) {
            const logMessage = `[${Logger.getTimestamp()}] [DEBUG] [${type}] ${message}`;
            console.debug(logMessage);
            Logger.writeToLogFile(Logger.getLogFileName(type), logMessage);
        }
    }

    static info(type: string, message: string): void {
        if (Logger.logLevel <= LogLevel.INFO) {
            const logMessage = `[${Logger.getTimestamp()}] [INFO] [${type}] ${message}`;
            console.info(logMessage);
            Logger.writeToLogFile(Logger.getLogFileName(type), logMessage);
        }
    }

    static warn(type: string, message: string): void {
        if (Logger.logLevel <= LogLevel.WARN) {
            const logMessage = `[${Logger.getTimestamp()}] [WARN] [${type}] ${message}`;
            console.warn(logMessage);
            Logger.writeToLogFile(Logger.getLogFileName(type), logMessage);
        }
    }

    static error(type: string, message: string): void {
        if (Logger.logLevel <= LogLevel.ERROR) {
            const logMessage = `[${Logger.getTimestamp()}] [ERROR] [${type}] ${message}`;
            console.error(logMessage);
            Logger.writeToLogFile(Logger.getLogFileName(type), logMessage);
        }
    }
}

export default Logger;
