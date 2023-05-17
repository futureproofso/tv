import pinoHttp from 'pino-http';

export const pino = pinoHttp({
  level: "debug",
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: true
    }
  }
});
export const logger = pino.logger;
export const dbLogger = pino.logger.child({ type: 'db' });
export const netLogger = pino.logger.child({ type: 'net' });

logger.info("The Village Buoy service is firing up 🔥 ...");
