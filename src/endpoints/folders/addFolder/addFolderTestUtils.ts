import {faker} from '@faker-js/faker';
import {IFolder} from '../../../definitions/folder';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {
  AppResourceType,
  getNonWorkspaceActionList,
  IPublicAccessOpInput,
} from '../../../definitions/system';
import {IWorkspace} from '../../../definitions/workspace';
import {IBaseContext} from '../../contexts/types';
import {
  assertCanReadPublicFile,
  assertCanUpdatePublicFile,
  assertCanUploadToPublicFile,
  assertPublicAccessOps,
} from '../../files/uploadFile/uploadFileTestUtils';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
} from '../../test-utils/test-utils';
import {folderConstants} from '../constants';
import deleteFolder from '../deleteFolder/handler';
import {IDeleteFolderEndpointParams} from '../deleteFolder/types';
import getFolder from '../getFolder/handler';
import {IGetFolderEndpointParams} from '../getFolder/types';
import listFolderContent from '../listFolderContent/handler';
import {IListFolderContentEndpointParams} from '../listFolderContent/types';
import FolderQueries from '../queries';
import updateFolder from '../updateFolder/handler';
import {
  IUpdateFolderEndpointParams,
  IUpdateFolderInput,
} from '../updateFolder/types';
import {addRootnameToPath, folderExtractor} from '../utils';
import {INewFolderInput} from './types';

export const addFolderBaseTest = async (
  ctx: IBaseContext,
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult
) => {
  insertUserResult = insertUserResult || (await insertUserForTest(ctx));
  insertWorkspaceResult =
    insertWorkspaceResult ||
    (await insertWorkspaceForTest(ctx, insertUserResult.userToken));

  const {folder} = await insertFolderForTest(
    ctx,
    insertUserResult.userToken,
    insertWorkspaceResult.workspace,
    input
  );

  const savedFolder = await ctx.data.folder.assertGetItem(
    FolderQueries.getById(folder.resourceId)
  );

  expect(folder).toMatchObject(folderExtractor(savedFolder));
  return {folder, savedFolder, insertUserResult, insertWorkspaceResult};
};

export const addFolderWithPublicAccessOpsTest = async (
  ctx: IBaseContext,
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult
) => {
  const uploadResult = await addFolderBaseTest(ctx, input);
  const {savedFolder} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertWorkspaceResult = uploadResult.insertWorkspaceResult;
  await assertPublicAccessOps(
    ctx,
    savedFolder,
    insertUserResult,
    insertWorkspaceResult,
    input.publicAccessOps || [],
    AppResourceType.Folder
  );

  return uploadResult;
};

export async function assertCanCreateFolderInPublicFolder(
  ctx: IBaseContext,
  workspace: IWorkspace,
  folderpath: string
) {
  return await insertFolderForTest(ctx, null, workspace, {
    folderpath: addRootnameToPath(folderpath, workspace.rootname),
  });
}

export async function assertCanReadPublicFolder(
  ctx: IBaseContext,
  workspace: IWorkspace,
  folderpath: string
) {
  const instData = RequestData.fromExpressRequest<IGetFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {folderpath: addRootnameToPath(folderpath, workspace.rootname)}
  );

  const result = await getFolder(ctx, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function assertCanUpdatePublicFolder(
  ctx: IBaseContext,
  workspace: IWorkspace,
  folderpath: string
) {
  const updateInput: IUpdateFolderInput = {
    description: faker.lorem.words(20),
    maxFileSizeInBytes: 9_000_000_000,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderEndpointParams>(
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
  ctx: IBaseContext,
  workspace: IWorkspace,
  folderpath: string
) {
  const instData =
    RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {folderpath: addRootnameToPath(folderpath, workspace.rootname)}
    );

  const result = await listFolderContent(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFolder(
  ctx: IBaseContext,
  workspace: IWorkspace,
  folderpath: string
) {
  const instData = RequestData.fromExpressRequest<IDeleteFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {folderpath: addRootnameToPath(folderpath, workspace.rootname)}
  );

  const result = await deleteFolder(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertPublicOps(
  ctx: IBaseContext,
  folder: IFolder,
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
    folder02Path + folderConstants.nameSeparator + faker.lorem.word()
  );

  await assertCanListContentOfPublicFolder(
    ctx,
    insertWorkspaceResult.workspace,
    folder02Path
  );

  await assertCanUpdatePublicFolder(
    ctx,
    insertWorkspaceResult.workspace,
    folder02Path
  );

  await assertCanReadPublicFolder(
    ctx,
    insertWorkspaceResult.workspace,
    folder02Path
  );

  const filepath = file.namePath.join(folderConstants.nameSeparator);
  await assertCanReadPublicFile(ctx, insertWorkspaceResult.workspace, filepath);
  await assertCanUpdatePublicFile(
    ctx,
    insertWorkspaceResult.workspace,
    filepath
  );

  await assertCanUploadToPublicFile(
    ctx,
    insertWorkspaceResult.workspace,
    filepath
  );

  await assertCanDeletePublicFolder(
    ctx,
    insertWorkspaceResult.workspace,
    folderpath
  );
}

export function makeEveryFolderPublicAccessOp() {
  return getNonWorkspaceActionList().reduce((list, action) => {
    return list.concat(
      [AppResourceType.File, AppResourceType.Folder].map(type => ({
        action,
        resourceType: type,
        appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
      }))
    );
  }, [] as IPublicAccessOpInput[]);
}

export function makeEveryFolderPublicAccessOp02() {
  return getNonWorkspaceActionList().reduce((list, action) => {
    return list.concat(
      [AppResourceType.File, AppResourceType.Folder].map(type => ({
        action,
        resourceType: type,
        appliesTo: PermissionItemAppliesTo.OwnerAndChildren,
      }))
    );
  }, [] as IPublicAccessOpInput[]);
}
