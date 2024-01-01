import {Logger} from 'winston';
import {
  FimidaraLoggerServiceNames,
  createAppLogger,
} from '../../utils/logger/loggerUtils';
import {kUtilsInjectables} from './injection/injectables';

export async function globalDispose() {
  const closeLoggersPromise = Promise.all(
    Object.values(FimidaraLoggerServiceNames).map(service => {
      const logger = createAppLogger.cache.get(service) as Logger | undefined;
      return logger?.close();
    })
  );

  await Promise.all([
    closeLoggersPromise,
    kUtilsInjectables.email().close(),
    kUtilsInjectables.secretsManager().close(),
    kUtilsInjectables.mongoConnection().close(),
    kUtilsInjectables.disposablesStore().disposeAll(),
  ]);
  await kUtilsInjectables.promiseStore().close().flush();
}
