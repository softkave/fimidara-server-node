import {globalDispose} from '../endpoints/contexts/globalUtils';
import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import {registerUtilsInjectables} from '../endpoints/contexts/injection/register';
import {kFimidaraConfigDbType} from '../resources/config';
import {restApiEndpointsInfoGen} from './restApiEndpointsInfoGen';
import {restApiTableOfContentGen} from './restApiTableOfContentGen';

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
