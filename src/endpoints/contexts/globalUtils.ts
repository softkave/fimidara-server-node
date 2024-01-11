import {Logger} from 'winston';
import {
  FimidaraLoggerServiceNames,
  createAppLogger,
} from '../../utils/logger/loggerUtils';
import {kUtilsInjectables} from './injection/injectables';
import {registerInjectables} from './injection/register';

export async function globalDispose() {
  const closeLoggersPromise = Promise.all(
    Object.values(FimidaraLoggerServiceNames).map(service => {
      const logger = createAppLogger.cache.get(service) as Logger | undefined;
      logger?.close();
    })
  );
  kUtilsInjectables.disposables().disposeAll();
  await Promise.all([closeLoggersPromise, kUtilsInjectables.dbConnection().close()]);
  await kUtilsInjectables.promises().close().flush();
}

export async function globalSetup() {
  registerInjectables();
  await kUtilsInjectables.dbConnection().wait();
}
