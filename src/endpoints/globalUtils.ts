import {
  decideTransport,
  FimidaraLoggerServiceNames,
  loggerFactory,
} from '../utils/logger/loggerUtils';

export const logger = loggerFactory({
  transports: decideTransport(),
  meta: {service: FimidaraLoggerServiceNames.Server},
});

export const consoleLogger = loggerFactory({
  meta: {service: FimidaraLoggerServiceNames.Server},
  transports: ['console'],
});

export async function disposeGlobalUtils() {
  await Promise.all([logger.close(), consoleLogger.close()]);
}
