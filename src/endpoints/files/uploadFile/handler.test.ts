import assert = require('assert');
import {
  AppResourceType,
  BasicCRUDActions,
  IPublicAccessOp,
  IPublicAccessOpInput,
} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {getBodyFromStream} from '../../contexts/FilePersistenceProviderContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  IInsertOrganizationForTestResult,
  IInsertUserForTestResult,
  insertFileForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import FileQueries from '../queries';
import {fileExtractor} from '../utils';
import {IUploadFileParams, UploadFilePublicAccessActions} from './types';
import {folderConstants} from '../../folders/constants';
import {IFile} from '../../../definitions/file';
import {IUserToken} from '../../../definitions/userToken';
import PermissionItemQueries from '../../permissionItems/queries';
import {makePermissionItemInputsFromPublicAccessOps} from '../../permissionItems/utils';
import {IGetFileEndpointParams} from '../getFile/types';
import getFile from '../getFile/handler';
import deleteFile from '../deleteFile/handler';
import {IDeleteFileParams} from '../deleteFile/types';
import {
  IUpdateFileDetailsEndpointParams,
  IUpdateFileDetailsInput,
} from '../updateFileDetails/types';
import faker = require('faker');
import updateFileDetails from '../updateFileDetails/handler';
import {PermissionDeniedError} from '../../user/errors';
import {IOrganization} from '../../../definitions/organization';
import {indexArray} from '../../../utilities/indexArray';
import {INewPermissionItemInput} from '../../permissionItems/addItems/types';
import {expectErrorThrown} from '../../test-utils/helpers/error';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

const uploadFileBaseTest = async (
  ctx: IBaseContext,
  input: Partial<IUploadFileParams> = {},
  type: 'image' | 'text' = 'image',
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
  resource: {resourceId: string; publicAccessOps: IPublicAccessOp[]},
  insertUserResult: IInsertUserForTestResult,
  insertOrgResult: IInsertOrganizationForTestResult,
  publicAccessOpsInput: IPublicAccessOpInput[]
) {
  const agent = await ctx.session.getAgent(
    ctx,
    RequestData.fromExpressRequest(
      mockExpressRequestWithUserToken(insertUserResult.userToken)
    )
  );

  const resourcePublicAccessOpsMap = indexArray(resource.publicAccessOps, {
    indexer: op => op.action + op.resourceType,
  });

  publicAccessOpsInput.forEach(op => {
    expect(
      resourcePublicAccessOpsMap[op.action + op.resourceType]
    ).toMatchObject({
      action: op.action,
      resourceType: op.resourceType,
      markedBy: {
        agentId: agent.agentId,
        agentType: agent.agentType,
      },
    });
  });

  assert(insertOrgResult.organization.publicPresetId);
  const publicPresetPermissionitems =
    await ctx.data.permissionItem.getManyItems(
      PermissionItemQueries.getByPermissionEntity(
        insertOrgResult.organization.publicPresetId,
        AppResourceType.PresetPermissionsGroup
      )
    );

  const basePermissionItems = makePermissionItemInputsFromPublicAccessOps(
    resource.resourceId,
    AppResourceType.File,
    publicAccessOpsInput,
    resource.resourceId
  );

  const permissionItemIndexer = (item: INewPermissionItemInput) =>
    item.permissionOwnerId +
    '-' +
    item.permissionOwnerType +
    '-' +
    item.itemResourceId +
    '-' +
    item.itemResourceType +
    '-' +
    item.action +
    '-' +
    item.isExclusion +
    '-' +
    item.isForPermissionOwnerOnly;

  const publicPresetPermissionitemsMap = indexArray(
    publicPresetPermissionitems,
    {indexer: permissionItemIndexer}
  );

  basePermissionItems.forEach(item => {
    expect(
      publicPresetPermissionitemsMap[permissionItemIndexer(item)]
    ).toMatchObject(item);
  });
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

const uploadFileWithPublicAccessActionTest = async (
  ctx: IBaseContext,
  input: Partial<IUploadFileParams>,
  expectedPublicAccessOpsCount: number,
  expectedActions: BasicCRUDActions[],
  type: 'image' | 'text' = 'image',
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
  expect(savedFile.publicAccessOps).toHaveLength(expectedPublicAccessOpsCount);
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
    })
  );

  return uploadResult;
};

async function assertFileUpdated(
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
  expect(savedFile.publicAccessOps).not.toBe(updatedFile.publicAccessOps);
  expect(updatedFile.lastUpdatedAt).toBeTruthy();
  expect(updatedFile.lastUpdatedBy).toMatchObject({
    agentId: agent.agentId,
    agentType: agent.agentType,
  });
}

export async function assertCanReadPublicFile(
  ctx: IBaseContext,
  organizationId: string,
  filePath: string
) {
  const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, path: filePath}
  );

  const result = await getFile(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanUploadToPublicFile(
  ctx: IBaseContext,
  organizationId: string,
  filePath: string
) {
  return await insertFileForTest(ctx, null, organizationId, {
    organizationId,
    path: filePath,
  });
}

export async function assertCanUpdatePublicFile(
  ctx: IBaseContext,
  organizationId: string,
  filePath: string
) {
  const updateInput: IUpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData =
    RequestData.fromExpressRequest<IUpdateFileDetailsEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {organizationId, path: filePath, file: updateInput}
    );

  const result = await updateFileDetails(ctx, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFile(
  ctx: IBaseContext,
  organizationId: string,
  filePath: string
) {
  const instData = RequestData.fromExpressRequest<IDeleteFileParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, path: filePath}
  );

  const result = await deleteFile(ctx, instData);
  assertEndpointResultOk(result);
}

describe('uploadFile', () => {
  test('file uploaded', async () => {
    assertContext(context);
    await uploadFileBaseTest(context);
  });

  test('file uploaded with public read access action', async () => {
    assertContext(context);
    const {file, insertOrgResult} = await uploadFileWithPublicAccessActionTest(
      context,
      {publicAccessActions: UploadFilePublicAccessActions.Read},
      /* expectedPublicAccessOpsCount */ 1,
      [BasicCRUDActions.Read]
    );

    const filePath = file.namePath.join(folderConstants.nameSeparator);

    expectErrorThrown(async () => {
      assertContext(context);
      await assertCanDeletePublicFile(
        context,
        insertOrgResult.organization.resourceId,
        filePath
      );
    }, [PermissionDeniedError.name]);

    expectErrorThrown(async () => {
      assertContext(context);
      await assertCanUpdatePublicFile(
        context,
        insertOrgResult.organization.resourceId,
        filePath
      );
    }, [PermissionDeniedError.name]);
  });

  test('file uploaded with public read and update access action', async () => {
    assertContext(context);
    await uploadFileWithPublicAccessActionTest(
      context,
      {publicAccessActions: UploadFilePublicAccessActions.ReadAndUpdate},
      /* expectedPublicAccessOpsCount */ 3,
      [BasicCRUDActions.Read, BasicCRUDActions.Update, BasicCRUDActions.Create]
    );
  });

  test('file uploaded with public read, update and delete access action', async () => {
    assertContext(context);
    const {insertOrgResult, file} = await uploadFileWithPublicAccessActionTest(
      context,
      {publicAccessActions: UploadFilePublicAccessActions.ReadUpdateAndDelete},
      /* expectedPublicAccessOpsCount */ 4,
      [
        BasicCRUDActions.Read,
        BasicCRUDActions.Update,
        BasicCRUDActions.Delete,
        BasicCRUDActions.Create,
      ]
    );

    const filePath = file.namePath.join(folderConstants.nameSeparator);
    await assertCanReadPublicFile(
      context,
      insertOrgResult.organization.resourceId,
      filePath
    );

    await assertCanUploadToPublicFile(
      context,
      insertOrgResult.organization.resourceId,
      filePath
    );

    await assertCanUpdatePublicFile(
      context,
      insertOrgResult.organization.resourceId,
      filePath
    );

    await assertCanDeletePublicFile(
      context,
      insertOrgResult.organization.resourceId,
      filePath
    );
  });

  test('file updated when new data uploaded', async () => {
    assertContext(context);
    const {savedFile, insertUserResult, insertOrgResult} =
      await uploadFileBaseTest(context);
    const update: Partial<IUploadFileParams> = {
      path: savedFile.namePath.join(folderConstants.nameSeparator),
      publicAccessActions: UploadFilePublicAccessActions.Read,
    };

    const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
      context,
      update,
      /* expectedPublicAccessOpsCount */ 1,
      [BasicCRUDActions.Read],
      /* type */ 'text',
      insertUserResult,
      insertOrgResult
    );

    await assertFileUpdated(
      context,
      insertUserResult.userToken,
      savedFile,
      updatedFile
    );
  });

  test('public file updated and made non-public', async () => {
    assertContext(context);
    const {savedFile, insertUserResult, insertOrgResult} =
      await uploadFileWithPublicAccessActionTest(
        context,
        {
          publicAccessActions:
            UploadFilePublicAccessActions.ReadUpdateAndDelete,
        },
        /* expectedPublicAccessOpsCount */ 4,
        [
          BasicCRUDActions.Read,
          BasicCRUDActions.Update,
          BasicCRUDActions.Delete,
          BasicCRUDActions.Create,
        ]
      );

    const update: Partial<IUploadFileParams> = {
      path: savedFile.namePath.join(folderConstants.nameSeparator),
      publicAccessActions: UploadFilePublicAccessActions.None,
    };

    const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
      context,
      update,
      /* expectedPublicAccessOpsCount */ 0,
      /* expectedActions */ [],
      /* type */ 'text',
      insertUserResult,
      insertOrgResult
    );

    await assertFileUpdated(
      context,
      insertUserResult.userToken,
      savedFile,
      updatedFile
    );

    await assertPublicPermissionsDonotExistForOwner(
      context,
      insertOrgResult.organization,
      savedFile.resourceId
    );
  });
});
