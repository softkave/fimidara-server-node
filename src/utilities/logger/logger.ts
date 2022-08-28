import {
  decideTransport,
  FimidaraLoggerServiceNames,
  loggerFactory,
} from './loggerUtils';

export const logger = loggerFactory({
  transports: decideTransport(),
  meta: {service: FimidaraLoggerServiceNames.Server},
});

export const consoleLogger = loggerFactory({
  meta: {service: FimidaraLoggerServiceNames.Server},
  transports: ['console'],
});
