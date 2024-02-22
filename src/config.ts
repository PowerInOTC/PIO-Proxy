export const config = {
    logLevel: process.env.LOG_LEVEL || '',
    logDirectory: process.env.LOG_DIRECTORY || 'logs',
    https: process.env.HTTPS === 'true' || false,
    sslCertPrivateKeyPath: process.env.SSL_CERT_PRIVATE_KEY_PATH || './privkey.pem',
    sslCertCertificatePath: process.env.SSL_CERT_CERTIFICATE_PATH || './fullchain.pem',
    serverAddress: process.env.SERVER_ADDRESS || '127.0.0.1',
    serverPort: process.env.SERVER_PORT || '3000',
    fmpKey: process.env.FMP_KEY || '',
    alpacaKey: process.env.ALPACA_KEY || '',
    alpacaSecret: process.env.ALPACA_SECRET || ''
};
