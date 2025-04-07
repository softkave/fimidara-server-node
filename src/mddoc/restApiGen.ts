import {globalDispose} from '../contexts/globalUtils.js';
import {kIjxUtils} from '../contexts/ijx/injectables.js';
import {registerIjxUtils} from '../contexts/ijx/register.js';
import {
  kFimidaraConfigDbType,
  kFimidaraConfigQueueProvider,
} from '../resources/config.js';
import {restApiEndpointsInfoGen} from './restApiEndpointsInfoGen.js';
import {restApiTableOfContentGen} from './restApiTableOfContentGen.js';

async function main() {
  await registerIjxUtils({
    dbType: kFimidaraConfigDbType.noop,
    queueProvider: kFimidaraConfigQueueProvider.memory,
    pubSubProvider: kFimidaraConfigQueueProvider.memory,
    redlockProvider: kFimidaraConfigQueueProvider.memory,
    cacheProvider: kFimidaraConfigQueueProvider.memory,
    dsetProvider: kFimidaraConfigQueueProvider.memory,
    redisURL: '',
  });

  try {
    await Promise.all([restApiEndpointsInfoGen(), restApiTableOfContentGen()]);
    kIjxUtils.logger().log('mddoc gen rest api complete');
  } finally {
    await globalDispose();
  }
}

main();
