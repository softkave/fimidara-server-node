import * as fse from 'fs-extra';
import {forEach} from 'lodash';
import {posix} from 'path';
import {getFimidaraPublicHttpEndpoints} from '../endpoints/endpoints';
import {
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints/endpoints.mddoc';
import {ExportedHttpEndpointWithMddocDefinition} from '../endpoints/types';
import {accessorFieldsToObject} from '../utils/classAccessors';
import {MddocTypeHttpEndpoint} from './mddoc';

function generateEndpointInfoFromEndpoints() {
  const infoMap = new Map<MddocTypeHttpEndpoint<any>, string>();
  const fimidaraPublicHttpEndpoints = getFimidaraPublicHttpEndpoints();

  forEach(fimidaraPublicHttpEndpoints, (groupedEndpoints, groupName) => {
    forEach(groupedEndpoints, (endpoint: ExportedHttpEndpointWithMddocDefinition<any>) => {
      const info = accessorFieldsToObject(
        endpoint.mddocHttpDefinition
          .setErrorResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
          .setErrorResponseBody(mddocEndpointHttpResponseItems.errorResponseBody),
        []
      );
      infoMap.set(endpoint.mddocHttpDefinition, JSON.stringify(info, undefined, 4));
    });
  });

  return infoMap;
}

async function writeEndpointInfoToFile(endpointPath: string, info: string) {
  await fse.ensureFile(endpointPath);
  return fse.writeFile(endpointPath, info, {encoding: 'utf-8'});
}

export async function restApiEndpointsInfoGen() {
  const basepath = './mdoc/rest-api/endpoints';
  const infoMap = generateEndpointInfoFromEndpoints();
  const promises: Promise<any>[] = [];

  infoMap.forEach((info, endpoint) => {
    const endpointPath = posix.normalize(basepath + endpoint.assertGetBasePathname() + '.json');
    promises.push(writeEndpointInfoToFile(endpointPath, info));
  });

  return Promise.all(promises);
}
