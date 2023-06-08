import * as fse from 'fs-extra';
import {forEach} from 'lodash';
import path from 'path';
import {getFimidaraPublicHttpEndpoints} from '../endpoints/endpoints';

function generateTableOfContentFromFimidaraPublicEndpoints() {
  const tableOfContent: Array<[string, string]> = [];
  const endpoints = getFimidaraPublicHttpEndpoints();

  forEach(endpoints, e1 => {
    tableOfContent.push([
      e1.mddocHttpDefinition.assertGetBasePathname(),
      e1.mddocHttpDefinition.assertGetMethod(),
    ]);
  });

  return tableOfContent;
}

export async function restApiTableOfContentGen() {
  const basepath = './mdoc/rest-api/toc/v1';
  const tableOfContentFilename = path.normalize(basepath + '/table-of-content.json');
  const tableOfContent = generateTableOfContentFromFimidaraPublicEndpoints();

  fse.ensureFileSync(tableOfContentFilename);
  return fse.writeFile(tableOfContentFilename, JSON.stringify(tableOfContent, undefined, 4), {
    encoding: 'utf-8',
  });
}
