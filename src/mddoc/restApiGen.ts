import {globalDispose} from '../contexts/globalUtils.js';
import {kUtilsInjectables} from '../contexts/injection/injectables.js';
import {registerUtilsInjectables} from '../contexts/injection/register.js';
import {
  kFimidaraConfigDbType,
  kFimidaraConfigPubSubProvider,
  kFimidaraConfigQueueProvider,
} from '../resources/config.js';
import {restApiEndpointsInfoGen} from './restApiEndpointsInfoGen.js';
import {restApiTableOfContentGen} from './restApiTableOfContentGen.js';

async function main() {
  await registerUtilsInjectables({
    dbType: kFimidaraConfigDbType.noop,
    queueProvider: kFimidaraConfigQueueProvider.memory,
    pubSubProvider: kFimidaraConfigPubSubProvider.memory,
  });

  try {
    await Promise.all([restApiEndpointsInfoGen(), restApiTableOfContentGen()]);
    kUtilsInjectables.logger().log('mddoc gen rest api complete');
  } finally {
    await globalDispose();
  }
}

main();
