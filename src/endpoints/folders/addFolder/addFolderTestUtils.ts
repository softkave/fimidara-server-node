import {faker} from '@faker-js/faker';
import {Folder} from '../../../definitions/folder.js';
import {PublicWorkspace, Workspace} from '../../../definitions/workspace.js';
import {pathJoin} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {
  assertCanReadPublicFile,
  assertCanUpdatePublicFile,
  assertCanUploadToPublicFile,
} from '../../files/uploadFile/testutils/utils.js';
import {stringifyFilenamepath} from '../../files/utils.js';
import {generateTestFileName} from '../../testHelpers/generate/file.js';
import {
  IInsertWorkspaceForTestResult,
  assertEndpointResultOk,
  insertFolderForTest,
  mockExpressRequestForPublicAgent,
} from '../../testHelpers/utils.js';
import deleteFolder from '../deleteFolder/handler.js';
import {DeleteFolderEndpointParams} from '../deleteFolder/types.js';
import getFolder from '../getFolder/handler.js';
import {GetFolderEndpointParams} from '../getFolder/types.js';
import listFolderContent from '../listFolderContent/handler.js';
import {ListFolderContentEndpointParams} from '../listFolderContent/types.js';
import updateFolder from '../updateFolder/handler.js';
import {
  UpdateFolderEndpointParams,
  UpdateFolderInput,
} from '../updateFolder/types.js';
import {addRootnameToPath, stringifyFolderpath} from '../utils.js';

export async function assertCanCreateFolderInPublicFolder(
  workspace: PublicWorkspace,
  folderpath: string
) {
  return await insertFolderForTest(null, workspace, {
    folderpath: addRootnameToPath(folderpath, workspace.rootname),
  });
}

export async function assertCanReadPublicFolder(
  workspace: Pick<Workspace, 'rootname'>,
  folderpath: string
) {
  const reqData = RequestData.fromExpressRequest<GetFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {
      folderpath: addRootnameToPath(folderpath, workspace.rootname),
    }
  );

  const result = await getFolder(reqData);
  assertEndpointResultOk(result);
  return result;
}

export async function assertCanUpdatePublicFolder(
  workspace: Pick<Workspace, 'rootname'>,
  folderpath: string
) {
  const updateInput: UpdateFolderInput = {
    description: faker.lorem.words(20),
  };

  const reqData = RequestData.fromExpressRequest<UpdateFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {
      folderpath: addRootnameToPath(folderpath, workspace.rootname),
      folder: updateInput,
    }
  );

  const result = await updateFolder(reqData);
  assertEndpointResultOk(result);
}

export async function assertCanListContentOfPublicFolder(
  workspace: Pick<Workspace, 'rootname'>,
  folderpath: string
) {
  const reqData =
    RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {folderpath: addRootnameToPath(folderpath, workspace.rootname)}
    );

  const result = await listFolderContent(reqData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFolder(
  workspace: Pick<Workspace, 'rootname'>,
  folderpath: string
) {
  const reqData = RequestData.fromExpressRequest<DeleteFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {folderpath: addRootnameToPath(folderpath, workspace.rootname)}
  );

  const result = await deleteFolder(reqData);
  assertEndpointResultOk(result);
}

export async function assertFolderPublicOps(
  folder: Folder,
  insertWorkspaceResult: IInsertWorkspaceForTestResult
) {
  const folderpath = stringifyFolderpath(folder);
  const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
    insertWorkspaceResult.workspace,
    folderpath
  );

  const folder02Path = stringifyFolderpath(folder02);
  const {file} = await assertCanUploadToPublicFile(
    insertWorkspaceResult.workspace,
    pathJoin(folder02Path, generateTestFileName({includeStraySlashes: true}))
  );

  await assertCanListContentOfPublicFolder(
    insertWorkspaceResult.workspace,
    folder02Path
  );
  await assertCanUpdatePublicFolder(
    insertWorkspaceResult.workspace,
    folder02Path
  );
  await assertCanReadPublicFolder(
    insertWorkspaceResult.workspace,
    folder02Path
  );

  const filepath = stringifyFilenamepath(file);
  await assertCanReadPublicFile(insertWorkspaceResult.workspace, filepath);
  await assertCanUpdatePublicFile(insertWorkspaceResult.workspace, filepath);
  await assertCanUploadToPublicFile(insertWorkspaceResult.workspace, filepath);
  await assertCanDeletePublicFolder(
    insertWorkspaceResult.workspace,
    folderpath
  );
}
