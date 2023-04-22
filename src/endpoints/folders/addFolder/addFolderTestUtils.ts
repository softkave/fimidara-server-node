import {faker} from '@faker-js/faker';
import {Folder} from '../../../definitions/folder';
import {PublicWorkspace, Workspace} from '../../../definitions/workspace';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {
  assertCanReadPublicFile,
  assertCanUpdatePublicFile,
  assertCanUploadToPublicFile,
} from '../../files/uploadFile/uploadFileTestUtils';
import EndpointReusableQueries from '../../queries';
import {generateTestFileName} from '../../testUtils/generateData/file';
import {
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  assertEndpointResultOk,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
} from '../../testUtils/testUtils';
import {folderConstants} from '../constants';
import deleteFolder from '../deleteFolder/handler';
import {DeleteFolderEndpointParams} from '../deleteFolder/types';
import getFolder from '../getFolder/handler';
import {GetFolderEndpointParams} from '../getFolder/types';
import listFolderContent from '../listFolderContent/handler';
import {ListFolderContentEndpointParams} from '../listFolderContent/types';
import updateFolder from '../updateFolder/handler';
import {UpdateFolderEndpointParams, UpdateFolderInput} from '../updateFolder/types';
import {addRootnameToPath, folderExtractor} from '../utils';
import {NewFolderInput} from './types';

export const addFolderBaseTest = async (
  ctx: BaseContextType,
  input: Partial<NewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult
) => {
  insertUserResult = insertUserResult ?? (await insertUserForTest(ctx));
  insertWorkspaceResult =
    insertWorkspaceResult ?? (await insertWorkspaceForTest(ctx, insertUserResult.userToken));
  const {folder} = await insertFolderForTest(
    ctx,
    insertUserResult.userToken,
    insertWorkspaceResult.workspace,
    input
  );
  const savedFolder = await ctx.semantic.folder.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(folder.resourceId)
  );
  expect(folder).toMatchObject(folderExtractor(savedFolder));
  return {folder, savedFolder, insertUserResult, insertWorkspaceResult};
};

// export const addFolderWithPublicAccessOpsTest = async (
//   ctx: BaseContext,
//   input: Partial<NewFolderInput> = {},
//   insertWorkspaceResult?: IInsertWorkspaceForTestResult
// ) => {
//   const uploadResult = await addFolderBaseTest(ctx, input);
//   const {savedFolder} = uploadResult;
//   insertWorkspaceResult = uploadResult.insertWorkspaceResult;
//   await assertPublicAccessOps(ctx, savedFolder, insertWorkspaceResult, input.publicAccessOps ?? []);
//   return uploadResult;
// };

export async function assertCanCreateFolderInPublicFolder(
  ctx: BaseContextType,
  workspace: PublicWorkspace,
  folderpath: string
) {
  return await insertFolderForTest(ctx, null, workspace, {
    folderpath: addRootnameToPath(folderpath, workspace.rootname),
  });
}

export async function assertCanReadPublicFolder(
  ctx: BaseContextType,
  workspace: Pick<Workspace, 'rootname'>,
  folderpath: string
) {
  const instData = RequestData.fromExpressRequest<GetFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {
      folderpath: addRootnameToPath(folderpath, workspace.rootname),
    }
  );

  const result = await getFolder(ctx, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function assertCanUpdatePublicFolder(
  ctx: BaseContextType,
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

  const result = await updateFolder(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanListContentOfPublicFolder(
  ctx: BaseContextType,
  workspace: Pick<Workspace, 'rootname'>,
  folderpath: string
) {
  const instData = RequestData.fromExpressRequest<ListFolderContentEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {folderpath: addRootnameToPath(folderpath, workspace.rootname)}
  );

  const result = await listFolderContent(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFolder(
  ctx: BaseContextType,
  workspace: Pick<Workspace, 'rootname'>,
  folderpath: string
) {
  const instData = RequestData.fromExpressRequest<DeleteFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {folderpath: addRootnameToPath(folderpath, workspace.rootname)}
  );

  const result = await deleteFolder(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertFolderPublicOps(
  ctx: BaseContextType,
  folder: Folder,
  insertWorkspaceResult: IInsertWorkspaceForTestResult
) {
  const folderpath = folder.namePath.join(folderConstants.nameSeparator);
  const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
    ctx,
    insertWorkspaceResult.workspace,
    folderpath
  );

  const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
  const {file} = await assertCanUploadToPublicFile(
    ctx,
    insertWorkspaceResult.workspace,
    folder02Path + folderConstants.nameSeparator + generateTestFileName()
  );

  await assertCanListContentOfPublicFolder(ctx, insertWorkspaceResult.workspace, folder02Path);
  await assertCanUpdatePublicFolder(ctx, insertWorkspaceResult.workspace, folder02Path);
  await assertCanReadPublicFolder(ctx, insertWorkspaceResult.workspace, folder02Path);

  const filepath = file.namePath.join(folderConstants.nameSeparator);
  await assertCanReadPublicFile(ctx, insertWorkspaceResult.workspace, filepath);
  await assertCanUpdatePublicFile(ctx, insertWorkspaceResult.workspace, filepath);
  await assertCanUploadToPublicFile(ctx, insertWorkspaceResult.workspace, filepath);
  await assertCanDeletePublicFolder(ctx, insertWorkspaceResult.workspace, folderpath);
}

// export function makeEveryFolderPublicAccessOp() {
//   const actions = getNonWorkspaceActionList();
//   const types = [AppResourceType.File, AppResourceType.Folder];
//   const ops: PublicAccessOpInput[] = [];
//   actions.forEach(action => {
//     types.forEach(type => {
//       ops.push({
//         action,
//         resourceType: type,
//       });
//     });
//   });
//   return ops;
// }
