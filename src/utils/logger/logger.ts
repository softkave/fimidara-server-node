import {decideTransport, FimidaraLoggerServiceNames, loggerFactory} from './loggerUtils';

// TODO: lazy create loggers once and wrap in a ref counter that users should
// release once done.
export const logger = loggerFactory({
  transports: decideTransport(),
  meta: {service: FimidaraLoggerServiceNames.Server},
});

export const consoleLogger = loggerFactory({
  meta: {service: FimidaraLoggerServiceNames.Server},
  transports: ['console'],
});
