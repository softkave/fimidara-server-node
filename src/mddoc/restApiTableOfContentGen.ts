import fse from 'fs-extra';
import {forEach} from 'lodash-es';
import path from 'path';
import {getFimidaraHttpEndpoints} from '../endpoints/endpoints.js';
import {kEndpointTag} from '../endpoints/types.js';
import {filterEndpoints} from './utils.js';

function generateTableOfContentFromFimidaraPublicEndpoints() {
  const tableOfContent: Array<[string, string]> = [];
  const endpoints = getFimidaraHttpEndpoints();
  const pickedEndpoints = filterEndpoints(endpoints, [kEndpointTag.public]);

  forEach(pickedEndpoints, e1 => {
    tableOfContent.push([
      e1.mddocHttpDefinition.assertGetBasePathname(),
      e1.mddocHttpDefinition.assertGetMethod(),
    ]);
  });

  return tableOfContent;
}

export async function restApiTableOfContentGen() {
  const basepath = './mdoc/rest-api/toc/v1';
  const tableOfContentFilename = path.normalize(
    basepath + '/table-of-content.json'
  );
  const tableOfContent = generateTableOfContentFromFimidaraPublicEndpoints();

  fse.ensureFileSync(tableOfContentFilename);
  return fse.writeFile(
    tableOfContentFilename,
    JSON.stringify(tableOfContent, undefined, 4),
    {encoding: 'utf-8'}
  );
}
