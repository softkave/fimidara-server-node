import {globalDispose} from '../endpoints/contexts/globalUtils.js';
import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables.js';
import {registerUtilsInjectables} from '../endpoints/contexts/injection/register.js';
import {kFimidaraConfigDbType} from '../resources/config.js';
import {restApiEndpointsInfoGen} from './restApiEndpointsInfoGen.js';
import {restApiTableOfContentGen} from './restApiTableOfContentGen.js';

async function main() {
  await registerUtilsInjectables({dbType: kFimidaraConfigDbType.noop});

  try {
    await Promise.all([restApiEndpointsInfoGen(), restApiTableOfContentGen()]);
    kUtilsInjectables.logger().log('mddoc gen rest api complete');
  } finally {
    await globalDispose();
  }
}

main();
