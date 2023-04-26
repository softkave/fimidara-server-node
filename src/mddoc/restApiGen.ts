import {restApiEndpointsInfoGen} from './restApiEndpointsInfoGen';
import {restApiTableOfContentGen} from './restApiTableOfContentGen';

async function main() {
  await Promise.all([restApiEndpointsInfoGen(), restApiTableOfContentGen()]);
}

main()
  .then(() => console.log('mddoc gen rest api complete'))
  .catch(console.error.bind(console));
