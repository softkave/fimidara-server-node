import assert = require('assert');
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
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
import {makeFilePublicAccessOps} from './accessOps';
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

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

const uploadFileBaseTest = async (
  input: Partial<IUploadFileParams> = {},
  type: 'image' | 'text' = 'image',
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  assertContext(context);
  insertUserResult = insertUserResult || (await insertUserForTest(context));
  insertOrgResult =
    insertOrgResult ||
    (await insertOrganizationForTest(context, insertUserResult.userToken));

  const {file, buffer} = await insertFileForTest(
    context,
    insertUserResult.userToken,
    insertOrgResult.organization.resourceId,
    input,
    type
  );

  const persistedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
  });

  const savedBuffer =
    persistedFile.body && (await getBodyFromStream(persistedFile.body));

  assert(savedBuffer);
  expect(buffer.equals(savedBuffer)).toBe(true);
  const savedFile = await context.data.file.assertGetItem(
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

const uploadFileWithPublicAccessActionTest = async (
  input: Partial<IUploadFileParams>,
  expectedPublicAccessOpsCount: number,
  expectedActions: BasicCRUDActions[],
  type: 'image' | 'text' = 'image',
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  assertContext(context);
  const uploadResult = await uploadFileBaseTest(
    input,
    type,
    insertUserResult,
    insertOrgResult
  );

  const {savedFile} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertOrgResult = uploadResult.insertOrgResult;
  expect(savedFile.publicAccessOps).toHaveLength(expectedPublicAccessOpsCount);
  const agent = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(
      mockExpressRequestWithUserToken(insertUserResult.userToken)
    )
  );

  // expectedActions.forEach(action => {
  //   expect(savedFile.publicAccessOps).toContain(
  //     expect.objectContaining({
  //       action,
  //       resourceType: AppResourceType.File,
  //       markedBy: agent,
  //     })
  //   );
  // });

  expect(savedFile.publicAccessOps).toContain(
    expect.arrayContaining(
      expectedActions.map(action => {
        return {
          action,
          resourceType: AppResourceType.File,
          markedBy: agent,
        };
      })
    )
  );

  const publicPresetPermissionitems =
    await context.data.permissionItem.getManyItems(
      PermissionItemQueries.getByPermissionEntity(
        insertOrgResult.organization.publicPresetId!,
        AppResourceType.PresetPermissionsGroup
      )
    );

  const basePermissionItems = makePermissionItemInputsFromPublicAccessOps(
    savedFile.resourceId,
    AppResourceType.File,
    makeFilePublicAccessOps(agent, input.publicAccessActions),
    savedFile.resourceId
  );

  // basePermissionItems.forEach(item => {
  //   expect(publicPresetPermissionitems).toContainEqual(
  //     expect.objectContaining(item)
  //   );
  // });

  expect(publicPresetPermissionitems).toContainEqual(
    expect.arrayContaining(basePermissionItems)
  );

  return uploadResult;
};

async function assertFileUpdated(
  userToken: IUserToken,
  savedFile: IFile,
  updatedFile: IFile
) {
  assertContext(context);
  const agent = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken))
  );

  expect(savedFile.description).not.toBe(updatedFile.description);
  expect(savedFile.extension).not.toBe(updatedFile.extension);
  expect(savedFile.mimetype).not.toBe(updatedFile.mimetype);
  expect(savedFile.size).not.toBe(updatedFile.size);
  expect(savedFile.encoding).not.toBe(updatedFile.encoding);
  expect(savedFile.lastUpdatedAt).not.toBe(updatedFile.lastUpdatedAt);
  expect(savedFile.publicAccessOps).not.toBe(updatedFile.publicAccessOps);
  expect(savedFile.lastUpdatedBy).toBe(agent);
}

export async function assertCanReadPublicFile(
  organizationId: string,
  filePath: string
) {
  const instData = RequestData.fromExpressRequest<IGetFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, path: filePath}
  );

  assertContext(context);
  const result = await getFile(context, instData);
  assertEndpointResultOk(result);
}

export async function assertCanUploadToPublicFile(
  organizationId: string,
  filePath: string
) {
  assertContext(context);
  await insertFileForTest(context, null, organizationId, {
    organizationId,
    path: filePath,
  });
}

export async function assertCanUpdatePublicFile(
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

  assertContext(context);
  const result = await updateFileDetails(context, instData);
  assertEndpointResultOk(result);
}

export async function assertCanDeletePublicFile(
  organizationId: string,
  filePath: string
) {
  const instData = RequestData.fromExpressRequest<IDeleteFileParams>(
    mockExpressRequestForPublicAgent(),
    {organizationId, path: filePath}
  );

  assertContext(context);
  const result = await deleteFile(context, instData);
  assertEndpointResultOk(result);
}

describe('uploadFile', () => {
  test('file uploaded', async () => {
    await uploadFileBaseTest();
  });

  test('file uploaded with public read access action', async () => {
    const {file, insertOrgResult} = await uploadFileWithPublicAccessActionTest(
      {publicAccessActions: UploadFilePublicAccessActions.Read},
      /* expectedPublicAccessOpsCount */ 1,
      [BasicCRUDActions.Read]
    );

    const filePath = file.namePath.join(folderConstants.nameSeparator);
    expect(
      async () =>
        await assertCanReadPublicFile(
          insertOrgResult.organization.resourceId,
          filePath
        )
    ).toThrowError(PermissionDeniedError);

    expect(
      async () =>
        await assertCanUpdatePublicFile(
          insertOrgResult.organization.resourceId,
          filePath
        )
    ).toThrowError(PermissionDeniedError);
  });

  test('file uploaded with public read and update access action', async () => {
    await uploadFileWithPublicAccessActionTest(
      {publicAccessActions: UploadFilePublicAccessActions.ReadAndUpdate},
      /* expectedPublicAccessOpsCount */ 2,
      [BasicCRUDActions.Read, BasicCRUDActions.Update]
    );
  });

  test('file uploaded with public read, update and delete access action', async () => {
    const {insertOrgResult, file} = await uploadFileWithPublicAccessActionTest(
      {publicAccessActions: UploadFilePublicAccessActions.ReadUpdateAndDelete},
      /* expectedPublicAccessOpsCount */ 3,
      [BasicCRUDActions.Read, BasicCRUDActions.Update, BasicCRUDActions.Delete]
    );

    const filePath = file.namePath.join(folderConstants.nameSeparator);
    await assertCanReadPublicFile(
      insertOrgResult.organization.resourceId,
      filePath
    );

    await assertCanUploadToPublicFile(
      insertOrgResult.organization.resourceId,
      filePath
    );

    await assertCanUpdatePublicFile(
      insertOrgResult.organization.resourceId,
      filePath
    );

    await assertCanDeletePublicFile(
      insertOrgResult.organization.resourceId,
      filePath
    );
  });

  test('file updated when new data uploaded', async () => {
    assertContext(context);
    const {savedFile, insertUserResult} = await uploadFileBaseTest();
    const update: Partial<IUploadFileParams> = {
      path: savedFile.namePath.join(folderConstants.nameSeparator),
      publicAccessActions: UploadFilePublicAccessActions.Read,
    };

    const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
      update,
      /* expectedPublicAccessOpsCount */ 1,
      [BasicCRUDActions.Read],
      /* type */ 'text'
    );

    await assertFileUpdated(insertUserResult.userToken, savedFile, updatedFile);
  });

  test('public file updated and made non-public', async () => {
    assertContext(context);
    const {savedFile, insertUserResult} =
      await uploadFileWithPublicAccessActionTest(
        {
          publicAccessActions:
            UploadFilePublicAccessActions.ReadUpdateAndDelete,
        },
        /* expectedPublicAccessOpsCount */ 3,
        [
          BasicCRUDActions.Read,
          BasicCRUDActions.Update,
          BasicCRUDActions.Delete,
        ]
      );

    const update: Partial<IUploadFileParams> = {
      path: savedFile.namePath.join(folderConstants.nameSeparator),
      publicAccessActions: UploadFilePublicAccessActions.None,
    };

    const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
      update,
      /* expectedPublicAccessOpsCount */ 0,
      /* expectedActions */ [],
      /* type */ 'text'
    );

    await assertFileUpdated(insertUserResult.userToken, savedFile, updatedFile);
  });
});
