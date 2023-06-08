import {Logger} from 'winston';
import {FimidaraLoggerServiceNames, createAppLogger} from '../utils/logger/loggerUtils';

export async function globalDispose() {
  await Promise.all(
    Object.values(FimidaraLoggerServiceNames).map(service => {
      const logger = createAppLogger.cache.get(service) as Logger | undefined;
      return logger?.close();
    })
  );
}
