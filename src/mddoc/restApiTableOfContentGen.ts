import * as fse from 'fs-extra';
import {forEach, map} from 'lodash';
import path from 'path';
import {formatWithOptions} from 'util';
import {fimidaraPublicHttpEndpoints} from '../endpoints/endpoints';

export type AppHttpEndpointsTableOfContent = Array<string | [string, string[]]>;

function generateTableOfContentFromEndpoints(): AppHttpEndpointsTableOfContent {
  const tableOfContent: AppHttpEndpointsTableOfContent = [];

  forEach(fimidaraPublicHttpEndpoints, (groupedEndpoints, groupName) => {
    const groupEndpointNames = map(groupedEndpoints, endpoint =>
      endpoint.mddocHttpDefinition.assertGetBasePathname()
    );
    tableOfContent.push([groupName, groupEndpointNames]);
  });

  return tableOfContent;
}

async function main() {
  const basepath = './mdoc/rest-api/v1';
  const tableOfContentFilename = path.normalize(basepath + '/table-of-content.json');
  const tableOfContent = generateTableOfContentFromEndpoints();

  fse.ensureFileSync(tableOfContentFilename);
  return Promise.all([
    fse.writeFile(tableOfContentFilename, formatWithOptions({depth: 100}, tableOfContent), {
      encoding: 'utf-8',
    }),
  ]);
}

main()
  .then(() => console.log('mddoc gen rest api table of content complete'))
  .catch(console.error.bind(console));
