import {faker} from '@faker-js/faker';
import {merge} from 'lodash';
import {PartialDeep} from 'type-fest';
import {FimidaraEndpoints} from '../public-endpoints';
import {
  AddFolderEndpointParams,
  DeleteFolderEndpointParams,
  GetFolderEndpointParams,
  ListFolderContentEndpointParams,
  UpdateFolderEndpointParams,
} from '../public-types';
import {uploadFileTest} from './file';
import {
  ITestVars,
  addRootnameToPath,
  folderpathListToString,
  loopAndCollate,
  makeTestFilepath,
} from './utils';
import assert = require('assert');
import path = require('path');

export async function deleteFolderTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<DeleteFolderEndpointParams> = {}
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTest(endpoint, vars);
    folderpath = addRootnameToPath(
      folderpathListToString(folder.body.folder.namePath),
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const input: DeleteFolderEndpointParams = {folderpath};
  const result = await endpoint.folders.deleteFolder({body: input});
}

export async function getFolderTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<GetFolderEndpointParams> = {}
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTest(endpoint, vars);
    folderpath = addRootnameToPath(
      folderpathListToString(folder.body.folder.namePath),
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const input: GetFolderEndpointParams = {folderpath};
  const result = await endpoint.folders.getFolder({body: input});
  return result;
}

export async function updateFolderTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<UpdateFolderEndpointParams> = {}
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTest(endpoint, vars);
    folderpath = addRootnameToPath(
      folderpathListToString(folder.body.folder.namePath),
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

export async function setupFolderContentTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: {folderpath?: string} = {},
  count = 2
) {
  let folderpath = props.folderpath;
  if (!folderpath) {
    const folder = await addFolderTest(endpoint, vars);
    folderpath = addRootnameToPath(
      folderpathListToString(folder.body.folder.namePath),
      vars.workspaceRootname
    );
  }

  assert.ok(folderpath);
  const [childrenFolders, childrenFiles] = await Promise.all([
    ...loopAndCollate(count, index =>
      addFolderTest(endpoint, vars, {
        folder: {
          folderpath: path.posix.normalize(`${folderpath}/folder${index}`),
        },
      })
    ),
    ...loopAndCollate(count, index =>
      uploadFileTest(endpoint, vars, {
        filepath: path.posix.normalize(`${folderpath}/file${index}`),
      })
    ),
  ]);

  return {childrenFolders, childrenFiles, folderpath};
}

export async function listFolderContentTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: ListFolderContentEndpointParams
) {
  const result = await endpoint.folders.listFolderContent({body: props});
  return result;
}

export async function addFolderTest(
  endpoint: FimidaraEndpoints,
  vars: ITestVars,
  props: PartialDeep<AddFolderEndpointParams> = {}
) {
  const genInput: AddFolderEndpointParams = {
    folder: {
      description: faker.lorem.sentence(),
      folderpath: makeTestFilepath(
        vars.workspaceRootname,
        faker.system.directoryPath()
      ),
    },
  };

  const input = merge(genInput, props);
  const result = await endpoint.folders.addFolder({body: input});
  return result;
}

export async function deleteManyFoldersByPath(
  endpoint: FimidaraEndpoints,
  folderpaths: string[]
) {
  await Promise.allSettled(
    folderpaths.map(folderpath =>
      endpoint.folders.deleteFolder({body: {folderpath}})
    )
  );
}

export async function deleteManyFoldersById(
  endpoint: FimidaraEndpoints,
  ids: string[]
) {
  await Promise.allSettled(
    ids.map(folderId => endpoint.folders.deleteFolder({body: {folderId}}))
  );
}
