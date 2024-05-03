import {faker} from '@faker-js/faker';
import {merge} from 'lodash-es';
import {loopAndCollateAsync} from 'softkave-js-utils';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../../publicEndpoints';
import {
  AddFolderEndpointParams,
  DeleteFolderEndpointParams,
  GetFolderEndpointParams,
  ListFolderContentEndpointParams,
  UpdateFolderEndpointParams,
} from '../../publicTypes';
import {
  fimidaraAddRootnameToPath,
  stringifyFimidaraFoldernamepath,
} from '../../utils';
import {ITestVars} from '../utils';
import {uploadFileTestExecFn} from './file';
import assert = require('assert');
import path = require('path');

export async function deleteFolderTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeleteFolderEndpointParams> = {}
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTestExecFn(endpoint, vars);
    folderpath = stringifyFimidaraFoldernamepath(
      folder.body.folder,
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const input: DeleteFolderEndpointParams = {folderpath};
  return await endpoint.folders.deleteFolder({body: input});
}

export async function getFolderTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetFolderEndpointParams> = {}
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTestExecFn(endpoint, vars);
    folderpath = stringifyFimidaraFoldernamepath(
      folder.body.folder,
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const input: GetFolderEndpointParams = {folderpath};
  const result = await endpoint.folders.getFolder({body: input});
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
    folderpath = stringifyFimidaraFoldernamepath(
      folder.body.folder,
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

  const result = await endpoint.folders.updateFolder({body: input});
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
    folderpath = stringifyFimidaraFoldernamepath(
      folder.body.folder,
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const [childrenFolders, childrenFiles] = await Promise.all([
    loopAndCollateAsync(
      index =>
        addFolderTestExecFn(endpoint, vars, {
          folder: {
            folderpath: path.posix.normalize(`${folderpath}/folder${index}`),
          },
        }),
      count,
      /** settlement type */ 'all'
    ),
    loopAndCollateAsync(
      index =>
        uploadFileTestExecFn(endpoint, vars, {
          filepath: path.posix.normalize(`${folderpath}/file${index}`),
        }),
      count,
      /** settlement type */ 'all'
    ),
  ]);

  return {childrenFolders, childrenFiles, folderpath};
}

export async function listFolderContentTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: ListFolderContentEndpointParams
) {
  const result = await endpoint.folders.listFolderContent({body: props});
  return result;
}

export async function addFolderTestExecFn(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<AddFolderEndpointParams> = {}
) {
  const genInput: AddFolderEndpointParams = {
    folder: {
      description: faker.lorem.sentence(),
      folderpath: fimidaraAddRootnameToPath(
        faker.lorem.words(7).replaceAll(' ', '_'),
        vars.workspaceRootname
      ),
    },
  };

  const input = merge(genInput, props);
  const result = await endpoint.folders.addFolder({body: input});
  return result;
}
