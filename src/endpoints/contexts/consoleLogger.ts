import {createLogger} from 'winston';
import {consoleTransport, loggerFormat, loggerServiceName} from './loggerUtils';

export const consoleLogger = createLogger({
  level: 'info',
  format: loggerFormat,
  defaultMeta: {service: loggerServiceName},
  transports: [consoleTransport],
});
