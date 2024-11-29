import {startHandleAddFolderQueue} from '../endpoints/folders/addFolder/handleAddFolderQueue.js';
import {FimidaraSuppliedConfig} from '../resources/config.js';
import {kUtilsInjectables} from './injection/injectables.js';
import {registerInjectables} from './injection/register.js';

export async function globalDispose() {
  kUtilsInjectables.runtimeState().setIsEnded(true);
  await kUtilsInjectables.disposables().awaitDisposeAll();
  await kUtilsInjectables.promises().close().flush();
  await Promise.allSettled([
    ...kUtilsInjectables.redis().map(redis => redis.quit()),
    ...kUtilsInjectables.ioredis().map(redis => redis.quit()),
  ]);
  await kUtilsInjectables.dbConnection().close();
}

export async function globalSetup(overrideConfig: FimidaraSuppliedConfig = {}) {
  await registerInjectables(overrideConfig);
  await kUtilsInjectables.dbConnection().wait();

  const suppliedConfig = kUtilsInjectables.suppliedConfig();
  const logger = kUtilsInjectables.logger();

  if (suppliedConfig.useFimidaraApp) {
    logger.log('starting server app');
    await kUtilsInjectables.serverApp().startApp();
    logger.log('started server app');

    if (suppliedConfig.useFimidaraWorkerPool) {
      logger.log('starting worker pool');
      await kUtilsInjectables.workerPool().startPool();
      logger.log('started worker pool');
    }
  }

  if (
    suppliedConfig.addFolderQueueNo &&
    suppliedConfig.addFolderQueueNo.length > 0
  ) {
    suppliedConfig.addFolderQueueNo.map(queueNo => {
      startHandleAddFolderQueue(queueNo);
    });
  }
}
