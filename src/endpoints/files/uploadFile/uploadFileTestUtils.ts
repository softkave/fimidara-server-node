import faker = require('faker');
import assert = require('assert');
import {IFile} from '../../../definitions/file';
import {IOrganization} from '../../../definitions/organization';
import {
  IPublicAccessOpInput,
  AppResourceType,
  BasicCRUDActions,
} from '../../../definitions/system';
import {IUserToken} from '../../../definitions/userToken';
import {IBaseContext} from '../../contexts/BaseContext';
import {getBodyFromStream} from '../../contexts/FilePersistenceProviderContext';
import PermissionItemQueries from '../../permissionItems/queries';
import {makePermissionItemInputsFromPublicAccessOps} from '../../permissionItems/utils';
import RequestData from '../../RequestData';
import {
  IInsertUserForTestResult,
  IInsertOrganizationForTestResult,
  insertUserForTest,
  insertOrganizationForTest,
  insertFileForTest,
  mockExpressRequestWithUserToken,
  mockExpressRequestForPublicAgent,
  assertEndpointResultOk,
} from '../../test-utils/test-utils';
import deleteFile from '../deleteFile/handler';
import {IDeleteFileEndpointParams} from '../deleteFile/types';
import getFile from '../getFile/handler';
import {IGetFileEndpointParams} from '../getFile/types';
import FileQueries from '../queries';
import updateFileDetails from '../updateFileDetails/handler';
import {
  IUpdateFileDetailsInput,
  IUpdateFileDetailsEndpointParams,
} from '../updateFileDetails/types';
import {fileExtractor} from '../utils';
import {IUploadFileEndpointParams} from './types';
import {expectItemsByEntityPresent} from '../../test-utils/helpers/permissionItem';

export const uploadFileBaseTest = async (
  ctx: IBaseContext,
  input: Partial<IUploadFileEndpointParams> = {},
  type: 'png' | 'txt' = 'png',
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  insertUserResult = insertUserResult || (await insertUserForTest(ctx));
  insertOrgResult =
    insertOrgResult ||
    (await insertOrganizationForTest(ctx, insertUserResult.userToken));

  const {file, buffer} = await insertFileForTest(
    ctx,
    insertUserResult.userToken,
    insertOrgResult.organization.resourceId,
    input,
    type
  );

  const persistedFile = await ctx.fileBackend.getFile({
    bucket: ctx.appVariables.S3Bucket,
    key: file.resourceId,
  });

  const savedBuffer =
    persistedFile.body && (await getBodyFromStream(persistedFile.body));

  assert(savedBuffer);
  expect(buffer.equals(savedBuffer)).toBe(true);
  const savedFile = await ctx.data.file.assertGetItem(
    FileQueries.getById(file.resourceId)
  );

  expect(file).toMatchObject(fileExtractor(savedFile));
  return {
    file,
    savedFile,
    insertUserResult,
    insertOrgResult,
  };
};

export async function assertPublicAccessOps(
  ctx: IBaseContext,
  resource: {resourceId: string},
  insertUserResult: IInsertUserForTestResult,
  insertOrgResult: IInsertOrganizationForTestResult,
  publicAccessOpsInput: IPublicAccessOpInput[],
  resourceType: AppResourceType
) {
  // const agent = await ctx.session.getAgent(
  //   ctx,
  //   RequestData.fromExpressRequest(
  //     mockExpressRequestWithUserToken(insertUserResult.userToken)
  //   )
  // );

  // const resourcePublicAccessOpsMap = indexArray(resource.publicAccessOps, {
  //   indexer: op => op.action + op.resourceType,
  // });

  // publicAccessOpsInput.forEach(op => {
  //   expect(
  //     resourcePublicAccessOpsMap[op.action + op.resourceType]
  //   ).toMatchObject({
  //     action: op.action,
  //     resourceType: op.resourceType,
  //     markedBy: {
  //       agentId: agent.agentId,
  //       agentType: agent.agentType,
  //     },
  //   });
  // });

  assert(insertOrgResult.organization.publicPresetId);
  const publicPresetPermissionitems = (
    await ctx.data.permissionItem.getManyItems(
      PermissionItemQueries.getByPermissionEntity(
        insertOrgResult.organization.publicPresetId,
        AppResourceType.PresetPermissionsGroup
      )
    )
  ).map(item => {
    // Adding code to fill in itemResourceId, cause integration-test
    // using mongo as data backend fails when testing for folders
    // because the matched object when checking basePermissionItems has
    // it as 'undefined', and the public permissions do not.
    // If you can find a better fix, please implement it.
    return {...item, itemResourceId: item.itemResourceId};
  });

  const basePermissionItems = makePermissionItemInputsFromPublicAccessOps(
    resource.resourceId,
    resourceType,
    publicAccessOpsInput,
    resourceType === AppResourceType.File ? resource.resourceId : undefined
  );

  expectItemsByEntityPresent(
    publicPresetPermissionitems,
    basePermissionItems,
    insertOrgResult.organization.publicPresetId,
    AppResourceType.PresetPermissionsGroup
  );
}

export async function assertPublicPermissionsDonotExistForOwner(
  ctx: IBaseContext,
  organization: IOrganization,
  ownerId: string
) {
  assert(organization.publicPresetId);
  const publicPresetPermissionitems =
    await ctx.data.permissionItem.getManyItems(
      PermissionItemQueries.getByPermissionEntity(
        organization.publicPresetId,
        AppResourceType.PresetPermissionsGroup
      )
    );

  const items = publicPresetPermissionitems.filter(
    item => item.permissionOwnerId === ownerId
  );

  expect(items).toHaveLength(0);
}

export const uploadFileWithPublicAccessActionTest = async (
  ctx: IBaseContext,
  input: Partial<IUploadFileEndpointParams>,
  expectedPublicAccessOpsCount: number,
  expectedActions: BasicCRUDActions[],
  type: 'png' | 'txt' = 'png',
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  const uploadResult = await uploadFileBaseTest(
    ctx,
    input,
    type,
    insertUserResult,
    insertOrgResult
  );

  const {savedFile} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertOrgResult = uploadResult.insertOrgResult;
  // expect(savedFile.publicAccessOps).toHaveLength(expectedPublicAccessOpsCount);
  await assertPublicAccessOps(
    ctx,
    savedFile,
    insertUserResult,
    insertOrgResult,
    expectedActions.map(action => {
      return {
        action,
        resourceType: AppResourceType.File,
      };
    }),
    AppResourceType.File
  );

  return uploadResult;
};

export async function assertFileUpdated(
  ctx: IBaseContext,
  userToken: IUserToken,
  savedFile: IFile,
  updatedFile: IFile
) {
  const agent = await ctx.session.getAgent(
    ctx,
    RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken))
  );

  expect(savedFile.description).not.toBe(updatedFile.description);
  expect(savedFile.extension).not.toBe(updatedFile.extension);
  expect(savedFile.mimetype).not.toBe(updatedFile.mimetype);
  expect(savedFile.size).not.toBe(updatedFile.size);
  expect(savedFile.encoding).not.toBe(updatedFile.encoding);
  // expect(savedFile.publicAccessOps).not.toBe(updatedFile.publicAccessOps);
  expect(updatedFile.lastUpdatedAt).toBeTruthy();
  expect(updatedFile.lastUpdatedBy).toMatchObject({
    agentId: agent.agentId,
    agentType: agent.agentType,
  });
}

export async function assertCanReadPublicFile(
  ctx: IBaseContext,
  organizationId: string,
  filepath: string
) {
  const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, filepath: filepath}
  );

  const result = await getFile(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanUploadToPublicFile(
  ctx: IBaseContext,
  organizationId: string,
  filepath: string
) {
  return await insertFileForTest(ctx, null, organizationId, {
    organizationId,
    filepath: filepath,
  });
}

export async function assertCanUpdatePublicFile(
  ctx: IBaseContext,
  organizationId: string,
  filepath: string
) {
  const updateInput: IUpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData =
    RequestData.fromExpressRequest<IUpdateFileDetailsEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {organizationId, filepath: filepath, file: updateInput}
    );

  const result = await updateFileDetails(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFile(
  ctx: IBaseContext,
  organizationId: string,
  filepath: string
) {
  const instData = RequestData.fromExpressRequest<IDeleteFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, filepath: filepath}
  );

  const result = await deleteFile(ctx, instData);
  assertEndpointResultOk(result);
}
