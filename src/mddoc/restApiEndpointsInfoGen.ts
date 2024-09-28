import fse from 'fs-extra';
import {forEach} from 'lodash-es';
import {posix} from 'path';
import {getFimidaraHttpEndpoints} from '../endpoints/endpoints.js';
import {
  mddocEndpointHttpHeaderItems,
  mddocEndpointHttpResponseItems,
} from '../endpoints/endpoints.mddoc.js';
import {kEndpointTag} from '../endpoints/types.js';
import {accessorFieldsToObject} from '../utils/classAccessors.js';
import {HttpEndpointDefinitionType} from './mddoc.js';
import {filterEndpoints} from './utils.js';

function generateEndpointInfoFromEndpoints() {
  const infoMap = new Map<HttpEndpointDefinitionType<any>, string>();
  const fimidaraHttpEndpoints = getFimidaraHttpEndpoints();
  const pickedEndpoints = filterEndpoints(fimidaraHttpEndpoints, [
    kEndpointTag.public,
  ]);

  forEach(pickedEndpoints, endpoint => {
    const info = accessorFieldsToObject(
      endpoint.mddocHttpDefinition
        .setErrorResponseHeaders(
          mddocEndpointHttpHeaderItems.responseHeaders_JsonContentType
        )
        .setErrorResponseBody(mddocEndpointHttpResponseItems.errorResponseBody),
      /** skip fields prefix */ []
    );
    infoMap.set(
      endpoint.mddocHttpDefinition as any,
      JSON.stringify(info, /** replacer */ undefined, /** spaces */ 4)
    );
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
    const pathname = endpoint
      .assertGetBasePathname()
      .split('/')
      // filter out path variables
      .filter(p => !p.startsWith(':'))
      .join('/');
    const method = endpoint.assertGetMethod();
    const filename = `${pathname}__${method}.json`;
    const endpointPath = posix.normalize(basepath + filename);
    promises.push(writeEndpointInfoToFile(endpointPath, info));
  });

  return Promise.all(promises);
}
