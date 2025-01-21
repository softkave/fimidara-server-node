import {rm} from 'fs/promises';
import {globalSetup} from '../contexts/globalUtils.js';
import {initFimidara} from '../endpoints/runtime/initFimidara.js';
import {getSuppliedConfig} from '../resources/config.js';
import {dropMongoCollections} from './utils.js';

export async function setup() {
  await globalSetup(
    {
      useFimidaraApp: false,
      useFimidaraWorkerPool: false,
      addFolderQueueNo: [],
    },
    {
      useHandleFolderQueue: true,
      useHandleUsageRecordQueue: true,
      useHandleAddInternalMultipartIdQueue: true,
      useHandlePrepareFileQueue: true,
    }
  );
  await initFimidara();
}

export async function teardown() {
  const config = await getSuppliedConfig();
  const dropMongoPromise = dropMongoCollections(config);
  await Promise.all([
    dropMongoPromise,
    config.localFsDir && rm(config.localFsDir, {recursive: true, force: true}),
  ]);

  // {@link https://nodejs.org/docs/latest/api/process.html#processgetactiveresourcesinfo}
  // kUtilsInjectables.logger().log('Active resources ', getActiveResourcesInfo());

  // TODO: there are open handles keeping the test from closing, find and fix
  // them, then remove this
  // eslint-disable-next-line no-process-exit
  // process.exit();
}
