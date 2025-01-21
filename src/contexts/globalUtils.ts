import {startHandleAddInternalMultipartIdQueue} from '../endpoints/files/uploadFile/handleAddInternalMultipartId.js';
import {startHandleAddFolderQueue} from '../endpoints/folders/addFolder/handleAddFolderQueue.js';
import {FimidaraSuppliedConfig} from '../resources/config.js';
import {kUtilsInjectables} from './injection/injectables.js';
import {registerInjectables} from './injection/register.js';
import {startHandleUsageRecordQueue} from './usage/handleUsageOps.js';

export async function globalDispose() {
  kUtilsInjectables.runtimeState().setIsEnded(true);
  await kUtilsInjectables.disposables().awaitDisposeAll();
  await kUtilsInjectables.promises().close().flush();

  const {redisURL} = kUtilsInjectables.suppliedConfig();
  if (redisURL) {
    await Promise.allSettled([
      ...kUtilsInjectables.redis().map(redis => redis.quit()),
      ...kUtilsInjectables.ioredis().map(redis => redis.quit()),
    ]);
  }

  await kUtilsInjectables.dbConnection().close();
}

export async function globalSetup(
  overrideConfig: FimidaraSuppliedConfig = {},
  otherConfig: {
    useHandleFolderQueue?: boolean;
    useHandleUsageRecordQueue?: boolean;
    useHandleAddInternalMultipartIdQueue?: boolean;
  }
) {
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

  if (otherConfig.useHandleFolderQueue) {
    suppliedConfig.addFolderQueueNo?.map(queueNo => {
      startHandleAddFolderQueue(queueNo);
    });
  }

  if (otherConfig.useHandleUsageRecordQueue) {
    suppliedConfig.addUsageRecordQueueNo?.map(queueNo => {
      startHandleUsageRecordQueue(queueNo);
    });
    kUtilsInjectables.usage().startCommitBatchedUsageL1Interval();
    kUtilsInjectables.usage().startCommitBatchedUsageL2Interval();
  }

  if (otherConfig.useHandleAddInternalMultipartIdQueue) {
    suppliedConfig.addInternalMultipartIdQueueNo?.map(queueNo => {
      startHandleAddInternalMultipartIdQueue(queueNo);
    });
  }
}
