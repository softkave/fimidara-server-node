import winston from 'winston';
import {
  decideTransport,
  FimidaraLoggerServiceNames,
  loggerFactory,
} from '../utils/logger/loggerUtils';

let logger: winston.Logger | null = null;
let consoleLogger: winston.Logger | null = null;

export const getLogger = () => {
  if (!logger) {
    logger = loggerFactory({
      transports: decideTransport(),
      meta: {service: FimidaraLoggerServiceNames.Server},
    });
  }

  return logger;
};

export const getConsoleLogger = () => {
  if (!consoleLogger) {
    consoleLogger = loggerFactory({
      meta: {service: FimidaraLoggerServiceNames.Server},
      transports: ['console'],
    });
  }

  return consoleLogger;
};

export async function disposeApplicationGlobalUtilities() {
  await Promise.all([logger?.close(), consoleLogger?.close()]);
}
