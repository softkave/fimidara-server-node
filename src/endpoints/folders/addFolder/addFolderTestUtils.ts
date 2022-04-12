import faker = require('faker');
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  getNonWorkspaceActionList,
  IPublicAccessOpInput,
} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertPublicAccessOps,
  assertCanUploadToPublicFile,
  assertCanReadPublicFile,
  assertCanUpdatePublicFile,
} from '../../files/uploadFile/uploadFileTestUtils';
import RequestData from '../../RequestData';
import {
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  insertUserForTest,
  insertWorkspaceForTest,
  insertFolderForTest,
  mockExpressRequestForPublicAgent,
  assertEndpointResultOk,
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
  IUpdateFolderInput,
  IUpdateFolderEndpointParams,
} from '../updateFolder/types';
import {folderExtractor} from '../utils';
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
    insertWorkspaceResult.workspace.resourceId,
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
  workspaceId: string,
  folderpath: string
) {
  return await insertFolderForTest(ctx, null, workspaceId, {
    folderpath: folderpath,
  });
}

export async function assertCanReadPublicFolder(
  ctx: IBaseContext,
  workspaceId: string,
  folderpath: string
) {
  const instData = RequestData.fromExpressRequest<IGetFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {workspaceId, folderpath: folderpath}
  );

  const result = await getFolder(ctx, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function assertCanUpdatePublicFolder(
  ctx: IBaseContext,
  workspaceId: string,
  folderpath: string
) {
  const updateInput: IUpdateFolderInput = {
    description: faker.lorem.words(20),
    maxFileSizeInBytes: 9_000_000_000,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {
      workspaceId,
      folderpath: folderpath,
      folder: updateInput,
    }
  );

  const result = await updateFolder(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanListContentOfPublicFolder(
  ctx: IBaseContext,
  workspaceId: string,
  folderpath: string
) {
  const instData =
    RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {workspaceId, folderpath: folderpath}
    );

  const result = await listFolderContent(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFolder(
  ctx: IBaseContext,
  workspaceId: string,
  folderpath: string
) {
  const instData = RequestData.fromExpressRequest<IDeleteFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {workspaceId, folderpath: folderpath}
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
  const workspaceId = insertWorkspaceResult.workspace.resourceId;
  const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
    ctx,
    workspaceId,
    folderpath
  );

  const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
  const {file} = await assertCanUploadToPublicFile(
    ctx,
    workspaceId,
    folder02Path + '/' + faker.lorem.word()
  );

  await assertCanListContentOfPublicFolder(ctx, workspaceId, folder02Path);
  await assertCanUpdatePublicFolder(ctx, workspaceId, folder02Path);
  await assertCanReadPublicFolder(ctx, workspaceId, folder02Path);

  const filepath = file.namePath.join(folderConstants.nameSeparator);
  await assertCanReadPublicFile(ctx, workspaceId, filepath);
  await assertCanUpdatePublicFile(ctx, workspaceId, filepath);
  await assertCanUploadToPublicFile(ctx, workspaceId, filepath);
  await assertCanDeletePublicFolder(ctx, workspaceId, folderpath);
}

export function makeEveryFolderPublicAccessOp() {
  return getNonWorkspaceActionList().reduce((list, action) => {
    return list.concat(
      [AppResourceType.File, AppResourceType.Folder].map(type => ({
        action,
        resourceType: type,
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
      }))
    );
  }, [] as IPublicAccessOpInput[]);
}
