import {globalDispose} from '../contexts/globalUtils.js';
import {kUtilsInjectables} from '../contexts/injection/injectables.js';
import {registerUtilsInjectables} from '../contexts/injection/register.js';
import {
  kFimidaraConfigDbType,
  kFimidaraConfigQueueProvider,
} from '../resources/config.js';
import {restApiEndpointsInfoGen} from './restApiEndpointsInfoGen.js';
import {restApiTableOfContentGen} from './restApiTableOfContentGen.js';

async function main() {
  await registerUtilsInjectables({
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
    kUtilsInjectables.logger().log('mddoc gen rest api complete');
  } finally {
    await globalDispose();
  }
}

main();
