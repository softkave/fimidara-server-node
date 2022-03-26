import faker = require('faker');
import {IFolder} from '../../../definitions/folder';
import {
  AppResourceType,
  BasicCRUDActions,
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
  IInsertOrganizationForTestResult,
  insertUserForTest,
  insertOrganizationForTest,
  insertFolderForTest,
  mockExpressRequestForPublicAgent,
  assertEndpointResultOk,
} from '../../test-utils/test-utils';
import {folderConstants} from '../constants';
import deleteFolder from '../deleteFolder/handler';
import {IDeleteFolderParams} from '../deleteFolder/types';
import getFolder from '../getFolder/handler';
import {IGetFolderEndpointParams} from '../getFolder/types';
import listFolderContent from '../listFolderContent/handler';
import {IListFolderContentEndpointParams} from '../listFolderContent/types';
import FolderQueries from '../queries';
import updateFolder from '../updateFolder/handler';
import {IUpdateFolderInput, IUpdateFolderParams} from '../updateFolder/types';
import {folderExtractor} from '../utils';
import {INewFolderInput} from './types';

export const addFolderBaseTest = async (
  ctx: IBaseContext,
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  insertUserResult = insertUserResult || (await insertUserForTest(ctx));
  insertOrgResult =
    insertOrgResult ||
    (await insertOrganizationForTest(ctx, insertUserResult.userToken));

  const {folder} = await insertFolderForTest(
    ctx,
    insertUserResult.userToken,
    insertOrgResult.organization.resourceId,
    input
  );

  const savedFolder = await ctx.data.folder.assertGetItem(
    FolderQueries.getById(folder.resourceId)
  );

  expect(folder).toMatchObject(folderExtractor(savedFolder));
  return {folder, savedFolder, insertUserResult, insertOrgResult};
};

export const addFolderWithPublicAccessOpsTest = async (
  ctx: IBaseContext,
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  const uploadResult = await addFolderBaseTest(ctx, input);
  const {savedFolder} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertOrgResult = uploadResult.insertOrgResult;
  await assertPublicAccessOps(
    ctx,
    savedFolder,
    insertUserResult,
    insertOrgResult,
    input.publicAccessOps || [],
    AppResourceType.Folder
  );

  return uploadResult;
};

export async function assertCanCreateFolderInPublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  return await insertFolderForTest(ctx, null, organizationId, {
    folderPath: folderPath,
  });
}

export async function assertCanReadPublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  const instData = RequestData.fromExpressRequest<IGetFolderEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, folderPath: folderPath}
  );

  const result = await getFolder(ctx, instData);
  assertEndpointResultOk(result);
  return result;
}

export async function assertCanUpdatePublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  const updateInput: IUpdateFolderInput = {
    description: faker.lorem.words(20),
    maxFileSizeInBytes: 9_000_000_000,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderParams>(
    mockExpressRequestForPublicAgent(),
    {
      organizationId,
      folderPath: folderPath,
      folder: updateInput,
    }
  );

  const result = await updateFolder(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanListContentOfPublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  const instData =
    RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {organizationId, folderPath: folderPath}
    );

  const result = await listFolderContent(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFolder(
  ctx: IBaseContext,
  organizationId: string,
  folderPath: string
) {
  const instData = RequestData.fromExpressRequest<IDeleteFolderParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, folderPath: folderPath}
  );

  const result = await deleteFolder(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertPublicOps(
  ctx: IBaseContext,
  folder: IFolder,
  insertOrgResult: IInsertOrganizationForTestResult
) {
  const folderPath = folder.namePath.join(folderConstants.nameSeparator);
  const orgId = insertOrgResult.organization.resourceId;
  const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
    ctx,
    orgId,
    folderPath
  );

  const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
  const {file} = await assertCanUploadToPublicFile(
    ctx,
    orgId,
    folder02Path + '/' + faker.lorem.word()
  );

  await assertCanListContentOfPublicFolder(ctx, orgId, folder02Path);
  await assertCanUpdatePublicFolder(ctx, orgId, folder02Path);
  await assertCanReadPublicFolder(ctx, orgId, folder02Path);

  const filePath = file.namePath.join(folderConstants.nameSeparator);
  await assertCanReadPublicFile(ctx, orgId, filePath);
  await assertCanUpdatePublicFile(ctx, orgId, filePath);
  await assertCanUploadToPublicFile(ctx, orgId, filePath);
  await assertCanDeletePublicFolder(ctx, orgId, folderPath);
}

export function makeEveryFolderPublicAccessOp() {
  return [BasicCRUDActions.All].reduce((list, action) => {
    return list.concat(
      [AppResourceType.File, AppResourceType.Folder].map(type => ({
        action,
        resourceType: type,
      }))
    );
  }, [] as IPublicAccessOpInput[]);
}

export function makeEveryFolderPublicAccessOp02() {
  return Object.values(BasicCRUDActions).reduce((list, action) => {
    return list.concat(
      [AppResourceType.File, AppResourceType.Folder].map(type => ({
        action,
        resourceType: type,
      }))
    );
  }, [] as IPublicAccessOpInput[]);
}
