import * as fse from 'fs-extra';
import {forEach} from 'lodash';
import {posix} from 'path';
import {formatWithOptions} from 'util';
import {fimidaraPublicHttpEndpoints} from '../endpoints/endpoints';
import {
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints/endpoints.mddoc';
import {accessorFieldsToObject} from '../utils/classAccessors';
import {MddocTypeHttpEndpoint} from './mddoc';

function generateEndpointInfoFromEndpoints() {
  const infoMap = new Map<MddocTypeHttpEndpoint<any>, string>();

  forEach(fimidaraPublicHttpEndpoints, (groupedEndpoints, groupName) => {
    forEach(groupedEndpoints, endpoint => {
      const info = accessorFieldsToObject(
        endpoint.mddocHttpDefinition
          .setErrorResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
          .setErrorResponseBody(mddocEndpointHttpResponseItems.errorResponseBody),
        []
      );
      infoMap.set(endpoint.mddocHttpDefinition, formatWithOptions({depth: 100}, info));
    });
  });

  return infoMap;
}

async function writeEndpointInfoToFile(endpointPath: string, info: string) {
  await fse.ensureFile(endpointPath);
  return fse.writeFile(endpointPath, info, {encoding: 'utf-8'});
}

async function main() {
  const basepath = './mdoc/rest-api/endpoints-info';
  const infoMap = generateEndpointInfoFromEndpoints();
  const promises: Promise<any>[] = [];

  infoMap.forEach((info, endpoint) => {
    const endpointPath = posix.normalize(basepath + endpoint.assertGetBasePathname());
    promises.push(writeEndpointInfoToFile(endpointPath, info));
  });

  return Promise.all(promises);
}

main()
  .then(() => console.log('mddoc gen rest api endpoints info complete'))
  .catch(console.error.bind(console));
