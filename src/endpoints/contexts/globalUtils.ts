import {Logger} from 'winston';
import {
  FimidaraLoggerServiceNames,
  createAppLogger,
} from '../../utils/logger/loggerUtils';
import {kUtilsInjectables} from './injectables';

export async function globalDispose() {
  const closeLoggersPromise = Promise.all(
    Object.values(FimidaraLoggerServiceNames).map(service => {
      const logger = createAppLogger.cache.get(service) as Logger | undefined;
      return logger?.close();
    })
  );

  await Promise.all([closeLoggersPromise, kUtilsInjectables.email()?.close()]);
  await kUtilsInjectables.promiseStore().close().flush();
}
