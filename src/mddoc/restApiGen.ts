import {kUtilsInjectables} from '../endpoints/contexts/injection/injectables';
import {restApiEndpointsInfoGen} from './restApiEndpointsInfoGen';
import {restApiTableOfContentGen} from './restApiTableOfContentGen';

async function main() {
  await Promise.all([restApiEndpointsInfoGen(), restApiTableOfContentGen()]);
}

main()
  .then(() => kUtilsInjectables.logger().log('mddoc gen rest api complete'))
  .catch(kUtilsInjectables.logger().error.bind(kUtilsInjectables.logger()));
