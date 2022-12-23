import * as fs from 'fs';
import {
  deleteWorkspaceEndpointDefinition,
  getWorkspaceEndpointDefinition,
  updateWorkspaceEndpointDefinition,
} from '../endpoints/workspaces/endpoints';
import {formatDateTime, getDate} from '../utils/dateFns';
import {docEndpointList} from './mddoc';

function main() {
  const now = getDate();
  const filepath = './mdoc/fimidara ' + formatDateTime(now) + '.md';
  const md = docEndpointList([
    getWorkspaceEndpointDefinition,
    updateWorkspaceEndpointDefinition,
    deleteWorkspaceEndpointDefinition,
  ]);
  fs.writeFileSync(filepath, md);
}

main();
