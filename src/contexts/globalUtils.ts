import {startHandleAddInternalMultipartIdQueue} from '../endpoints/files/uploadFile/handleAddInternalMultipartIdQueue.js';
import {startHandlePrepareFileQueue} from '../endpoints/files/uploadFile/handlePrepareFileQueue.js';
import {startHandleAddFolderQueue} from '../endpoints/folders/addFolder/handleAddFolderQueue.js';
import {FimidaraSuppliedConfig} from '../resources/config.js';
import {kIkxUtils} from './ijx/injectables.js';
import {clearIjx, registerIjx} from './ijx/register.js';
import {startHandleUsageRecordQueue} from './usage/handleUsageOps.js';

export async function globalDispose() {
  kIkxUtils.runtimeState().setIsEnded(true);
  await kIkxUtils.disposables().awaitDisposeAll();
  await kIkxUtils.promises().close().flush();

  const {redisURL} = kIkxUtils.suppliedConfig();
  if (redisURL) {
    await Promise.allSettled([
      ...kIkxUtils.redis().map(redis => redis.quit()),
      ...kIkxUtils.ioredis().map(redis => redis.quit()),
    ]);
  }

  await kIkxUtils.dbConnection().close();
  clearIjx();
}

export async function globalSetup(
  overrideConfig: FimidaraSuppliedConfig = {},
  otherConfig: {
    useHandleFolderQueue?: boolean;
    useHandleUsageRecordQueue?: boolean;
    useHandleAddInternalMultipartIdQueue?: boolean;
    useHandlePrepareFileQueue?: boolean;
  }
) {
  await registerIjx(overrideConfig);
  await kIkxUtils.dbConnection().wait();

  const suppliedConfig = kIkxUtils.suppliedConfig();
  const logger = kIkxUtils.logger();

  if (suppliedConfig.useFimidaraApp) {
    logger.log('starting server app');
    await kIkxUtils.serverApp().startApp();
    logger.log('started server app');

    if (suppliedConfig.useFimidaraWorkerPool) {
      logger.log('starting worker pool');
      await kIkxUtils.workerPool().startPool();
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
    kIkxUtils.usage().startCommitBatchedUsageL1Interval();
    kIkxUtils.usage().startCommitBatchedUsageL2Interval();
  }

  if (otherConfig.useHandleAddInternalMultipartIdQueue) {
    suppliedConfig.addInternalMultipartIdQueueNo?.map(queueNo => {
      startHandleAddInternalMultipartIdQueue(queueNo);
    });
  }

  if (otherConfig.useHandlePrepareFileQueue) {
    suppliedConfig.prepareFileQueueNo?.map(queueNo => {
      startHandlePrepareFileQueue(queueNo);
    });
  }
}
