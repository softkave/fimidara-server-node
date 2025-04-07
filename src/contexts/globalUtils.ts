import {startHandleAddInternalMultipartIdQueue} from '../endpoints/files/uploadFile/handleAddInternalMultipartIdQueue.js';
import {startHandlePrepareFileQueue} from '../endpoints/files/uploadFile/handlePrepareFileQueue.js';
import {startHandleAddFolderQueue} from '../endpoints/folders/addFolder/handleAddFolderQueue.js';
import {FimidaraSuppliedConfig} from '../resources/config.js';
import {kIjxUtils} from './ijx/injectables.js';
import {clearIjx, registerIjx} from './ijx/register.js';
import {startHandleUsageRecordQueue} from './usage/handleUsageOps.js';

export async function globalDispose() {
  kIjxUtils.runtimeState().setIsEnded(true);
  await kIjxUtils.disposables().awaitDisposeAll();
  await kIjxUtils.promises().close().flush();

  const {redisURL} = kIjxUtils.suppliedConfig();
  if (redisURL) {
    await Promise.allSettled([
      ...kIjxUtils.redis().map(redis => redis.quit()),
      ...kIjxUtils.ioredis().map(redis => redis.quit()),
    ]);
  }

  await kIjxUtils.dbConnection().close();
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
  await kIjxUtils.dbConnection().wait();

  const suppliedConfig = kIjxUtils.suppliedConfig();
  const logger = kIjxUtils.logger();

  if (suppliedConfig.useFimidaraApp) {
    logger.log('starting server app');
    await kIjxUtils.serverApp().startApp();
    logger.log('started server app');

    if (suppliedConfig.useFimidaraWorkerPool) {
      logger.log('starting worker pool');
      await kIjxUtils.workerPool().startPool();
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
    kIjxUtils.usage().startCommitBatchedUsageL1Interval();
    kIjxUtils.usage().startCommitBatchedUsageL2Interval();
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
