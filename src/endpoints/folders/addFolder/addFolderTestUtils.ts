import {faker} from '@faker-js/faker';
import {Folder} from '../../../definitions/folder';
import {PublicWorkspace, Workspace} from '../../../definitions/workspace';
import {pathJoin} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {
  assertCanReadPublicFile,
  assertCanUpdatePublicFile,
  assertCanUploadToPublicFile,
} from '../../files/uploadFile/uploadFileTestUtils';
import {stringifyFilenamepath} from '../../files/utils';
import {generateTestFileName} from '../../testUtils/generate/file';
import {
  IInsertWorkspaceForTestResult,
  assertEndpointResultOk,
  insertFolderForTest,
  mockExpressRequestForPublicAgent,
} from '../../testUtils/testUtils';
import deleteFolder from '../deleteFolder/handler';
import {DeleteFolderEndpointParams} from '../deleteFolder/types';
import getFolder from '../getFolder/handler';
import {GetFolderEndpointParams} from '../getFolder/types';
import listFolderContent from '../listFolderContent/handler';
import {ListFolderContentEndpointParams} from '../listFolderContent/types';
import updateFolder from '../updateFolder/handler';
import {UpdateFolderEndpointParams, UpdateFolderInput} from '../updateFolder/types';
import {addRootnameToPath, stringifyFoldernamepath} from '../utils';

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
  const instData = RequestData.fromExpressRequest<GetFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {
      folderpath: addRootnameToPath(folderpath, workspace.rootname),
    }
  );

  const result = await getFolder(instData);
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

  const instData = RequestData.fromExpressRequest<UpdateFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {
      folderpath: addRootnameToPath(folderpath, workspace.rootname),
      folder: updateInput,
    }
  );

  const result = await updateFolder(instData);
  assertEndpointResultOk(result);
}

export async function assertCanListContentOfPublicFolder(
  workspace: Pick<Workspace, 'rootname'>,
  folderpath: string
) {
  const instData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {folderpath: addRootnameToPath(folderpath, workspace.rootname)}
  );

  const result = await listFolderContent(instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFolder(
  workspace: Pick<Workspace, 'rootname'>,
  folderpath: string
) {
  const instData = RequestData.fromExpressRequest<DeleteFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {folderpath: addRootnameToPath(folderpath, workspace.rootname)}
  );

  const result = await deleteFolder(instData);
  assertEndpointResultOk(result);
}

export async function assertFolderPublicOps(
  folder: Folder,
  insertWorkspaceResult: IInsertWorkspaceForTestResult
) {
  const folderpath = stringifyFoldernamepath(folder);
  const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
    insertWorkspaceResult.workspace,
    folderpath
  );

  const folder02Path = stringifyFoldernamepath(folder02);
  const {file} = await assertCanUploadToPublicFile(
    insertWorkspaceResult.workspace,
    pathJoin(folder02Path, generateTestFileName({includeStraySlashes: true}))
  );

  await assertCanListContentOfPublicFolder(insertWorkspaceResult.workspace, folder02Path);
  await assertCanUpdatePublicFolder(insertWorkspaceResult.workspace, folder02Path);
  await assertCanReadPublicFolder(insertWorkspaceResult.workspace, folder02Path);

  const filepath = stringifyFilenamepath(file);
  await assertCanReadPublicFile(insertWorkspaceResult.workspace, filepath);
  await assertCanUpdatePublicFile(insertWorkspaceResult.workspace, filepath);
  await assertCanUploadToPublicFile(insertWorkspaceResult.workspace, filepath);
  await assertCanDeletePublicFolder(insertWorkspaceResult.workspace, folderpath);
}
