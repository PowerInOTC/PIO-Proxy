import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import { config } from './config';
import { checkAuthorization } from './middleware/authMiddleware';
import { limiter } from './middleware/limiterMiddleware';
import { priceController } from './controllers/priceController';
import WorkerController from './utils/worker';
import Logger from './utils/logger';
import { handleFunctionError } from './utils/sharedUtils';

process.on('exit', shutdown);

Logger.setLogLevel(config.logLevel);

Logger.info('app', 'Starting API');

let isShuttingDown = false;

let server: http.Server | https.Server | null = null;

async function shutdown() {
    try {
        if (!isShuttingDown) {
            isShuttingDown = true;

            if (server) {
                server.close();
            }

            Logger.info('app', 'Server closed. Exiting process.');
            process.exit(0);
        }
    } catch (error) {
        if (error instanceof Error) {
            handleFunctionError('app', 'closeApp', `Caught an error: ${error.message}`);
        }

        process.exit(1);
    }
}

async function init(): Promise<void> {
    try {
        const app = express();

        if (config.https) {
            const privateKey = fs.readFileSync(config.sslCertPrivateKeyPath, 'utf8');
            const certificate = fs.readFileSync(config.sslCertCertificatePath, 'utf8');
            const credentials = { key: privateKey, cert: certificate };

            server = https.createServer(credentials, app);
        }
        else {
            server = http.createServer(app);
        }

        // Start the pricesUpdater worker
        const assetPricesUpdater = WorkerController.getInstance('./dist/workers/assetPricesUpdater.js');
        if (!(await assetPricesUpdater.sendMessageToWorker({ type: 'setassets' })).payload) {
            handleFunctionError('app', 'init', `Can't set assets`);
            await shutdown();
            return;
        }

        // Middleware
        app.use(express.json());

        app.get('/api/v1/get_pair_price', limiter(config.windowTime, config.maxRequests));

        app.get('/api/v1/get_pair_price', checkAuthorization);

        // Routes
        app.get('/api/v1/get_pair_price', priceController.getPairPrice);

        server.listen(config.serverPort, () => {
            const protocol: string = config.https ? 'https' : 'http';
            Logger.info('app', `Server running on ${protocol}://${config.serverAddress}:${config.serverPort}`);
        });
    } catch (error) {
        if (error instanceof Error) {
            handleFunctionError('app', 'init', `Caught an error: ${error.message}`);
        }
        shutdown();
    }
}

init();
