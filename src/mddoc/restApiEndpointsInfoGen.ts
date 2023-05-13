import * as fse from 'fs-extra';
import {forEach} from 'lodash';
import {posix} from 'path';
import {getFimidaraPublicHttpEndpoints} from '../endpoints/endpoints';
import {
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints/endpoints.mddoc';
import {accessorFieldsToObject} from '../utils/classAccessors';
import {MddocTypeHttpEndpoint} from './mddoc';

function generateEndpointInfoFromEndpoints() {
  const infoMap = new Map<MddocTypeHttpEndpoint<any>, string>();
  const fimidaraPublicHttpEndpoints = getFimidaraPublicHttpEndpoints();

  forEach(fimidaraPublicHttpEndpoints, e1 => {
    const info = accessorFieldsToObject(
      e1.mddocHttpDefinition
        .setErrorResponseHeaders(mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType)
        .setErrorResponseBody(mddocEndpointHttpResponseItems.errorResponseBody),
      []
    );
    infoMap.set(e1.mddocHttpDefinition, JSON.stringify(info, undefined, 4));
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

  await fse.remove(basepath);

  infoMap.forEach((info, endpoint) => {
    const pathname = endpoint.assertGetBasePathname();
    const method = endpoint.assertGetMethod();
    const filename = `${pathname}__${method}.json`;
    const endpointPath = posix.normalize(basepath + filename);
    promises.push(writeEndpointInfoToFile(endpointPath, info));
  });

  return Promise.all(promises);
}
