import * as fse from 'fs-extra';
import {forEach, map} from 'lodash';
import path from 'path';
import {getFimidaraPublicHttpEndpoints} from '../endpoints/endpoints';
import {ExportedHttpEndpointWithMddocDefinition} from '../endpoints/types';

export type AppHttpEndpointsTableOfContent = Array<string | [string, string[]]>;

function generateTableOfContentFromEndpoints(): AppHttpEndpointsTableOfContent {
  const tableOfContent: AppHttpEndpointsTableOfContent = [];
  const fimidaraPublicHttpEndpoints = getFimidaraPublicHttpEndpoints();

  forEach(fimidaraPublicHttpEndpoints, (groupedEndpoints, groupName) => {
    const groupEndpointNames = map(
      groupedEndpoints,
      (endpoint: ExportedHttpEndpointWithMddocDefinition<any>) =>
        endpoint.mddocHttpDefinition.assertGetBasePathname()
    );
    tableOfContent.push([groupName, groupEndpointNames]);
  });

  return tableOfContent;
}

export async function restApiTableOfContentGen() {
  const basepath = './mdoc/rest-api/toc/v1';
  const tableOfContentFilename = path.normalize(basepath + '/table-of-content.json');
  const tableOfContent = generateTableOfContentFromEndpoints();

  fse.ensureFileSync(tableOfContentFilename);
  return Promise.all([
    fse.writeFile(tableOfContentFilename, JSON.stringify(tableOfContent, undefined, 4), {
      encoding: 'utf-8',
    }),
  ]);
}
