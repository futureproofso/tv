const pinoHttp = require('pino-http');

const debug = process.env.NODE_ENV !== "production" || false;
const level = debug ? "debug" : (process.env.LOG_LEVEL || "info");
const config = { level };
if (debug) {
  config.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: true
    }
  }
}

const pino = pinoHttp(config);
const logger = pino.logger;
const dbLogger = pino.logger.child({ type: 'db' });
const netLogger = pino.logger.child({ type: 'net' });

logger.info("BUOY IS FIRING UP 🔥 ...");

module.exports = {
  pino,
  logger,
  dbLogger,
  netLogger
}
