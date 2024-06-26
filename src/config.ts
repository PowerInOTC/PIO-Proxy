export const config = {
  logLevel: process.env.LOG_LEVEL || '',
  logDirectory: process.env.LOG_DIRECTORY || 'logs',
  https: process.env.HTTPS === 'true' || false,
  sslCertPrivateKeyPath:
    process.env.SSL_CERT_PRIVATE_KEY_PATH || './privkey.pem',
  sslCertCertificatePath:
    process.env.SSL_CERT_CERTIFICATE_PATH || './fullchain.pem',
  serverAddress: process.env.SERVER_ADDRESS || '127.0.0.1',
  serverPort: process.env.SERVER_PORT || '3000',
  windowTime: parseInt(process.env.WINDOW_TIME || '60000'),
  maxRequests: parseInt(process.env.MAX_REQUESTS || '60'),
  defaultAbPrecision: parseInt(process.env.DEFAULT_AB_PRECISION || '0'),
  defaultConfPrecision: parseInt(process.env.DEFAULT_CONF_PRECISION || '0'),
  defaultMaxTimestampDiff: parseInt(
    process.env.DEFAULT_MAX_TIMESTAMP_DIFF || '0',
  ),
  maxAbPrecision: parseInt(process.env.MAX_AB_PRECISION || '20'),
  maxConfPrecision: parseInt(process.env.MAX_CONF_PRECISION || '20'),
  maxMaxTimestampDiff: parseInt(
    process.env.MAX_MAX_TIMESTAMP_DIFF || '604800000',
  ),
  fmpKey: process.env.FMP_KEY || '',
  alpacaKey: process.env.ALPACA_KEY || '',
  alpacaSecret: process.env.ALPACA_SECRET || '',
};
