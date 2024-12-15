import {faker} from '@faker-js/faker';
import assert from 'assert';
import {merge} from 'lodash-es';
import {kLoopAsyncSettlementType, loopAndCollateAsync} from 'softkave-js-utils';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../endpoints/publicEndpoints.js';
import {
  AddFolderEndpointParams,
  DeleteFolderEndpointParams,
  GetFolderEndpointParams,
  ListFolderContentEndpointParams,
  UpdateFolderEndpointParams,
} from '../../endpoints/publicTypes.js';
import {
  fimidaraAddRootnameToPath,
  stringifyFimidaraFolderpath,
} from '../../path/index.js';
import {uploadFileTestExecFn} from './file.js';
import path = require('path-browserify');
import {ITestVars} from '../utils.common.js';

export async function deleteFolderTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeleteFolderEndpointParams> = {}
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTestExecFn(endpoint, vars);
    folderpath = stringifyFimidaraFolderpath(
      folder.folder,
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const input: DeleteFolderEndpointParams = {folderpath};
  return await endpoint.folders.deleteFolder(input);
}

export async function getFolderTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetFolderEndpointParams> = {}
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTestExecFn(endpoint, vars);
    folderpath = stringifyFimidaraFolderpath(
      folder.folder,
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const input: GetFolderEndpointParams = {folderpath};
  const result = await endpoint.folders.getFolder(input);
  return result;
}

export async function updateFolderTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdateFolderEndpointParams> = {}
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTestExecFn(endpoint, vars);
    folderpath = stringifyFimidaraFolderpath(
      folder.folder,
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const input: UpdateFolderEndpointParams = {
    folderpath,
    folder: {
      description: faker.lorem.sentence(),
    },
  };

  const result = await endpoint.folders.updateFolder(input);
  return result;
}

export async function setupFolderContentTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: {folderpath?: string} = {},
  count = 2
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTestExecFn(endpoint, vars);
    folderpath = stringifyFimidaraFolderpath(
      folder.folder,
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const [childrenFolders, childrenFiles] = await Promise.all([
    loopAndCollateAsync(
      index =>
        addFolderTestExecFn(endpoint, vars, {
          folderpath: path.posix.normalize(`${folderpath}/folder${index}`),
        }),
      count,
      kLoopAsyncSettlementType.all
    ),
    loopAndCollateAsync(
      index =>
        uploadFileTestExecFn(endpoint, vars, {
          filepath: path.posix.normalize(`${folderpath}/file${index}`),
        }),
      count,
      kLoopAsyncSettlementType.all
    ),
  ]);

  return {childrenFolders, childrenFiles, folderpath};
}

export async function listFolderContentTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: ListFolderContentEndpointParams
) {
  const result = await endpoint.folders.listFolderContent(props);
  return result;
}

export async function addFolderTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<AddFolderEndpointParams> = {}
) {
  const genInput: AddFolderEndpointParams = {
    description: faker.lorem.sentence(),
    folderpath: fimidaraAddRootnameToPath(
      faker.lorem.words(7).replaceAll(' ', '_'),
      vars.workspaceRootname
    ),
  };

  const input = merge(genInput, props);
  const result = await endpoint.folders.addFolder(input);
  return result;
}
