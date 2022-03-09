import {defaultTo} from 'lodash';
import {AppResourceType, BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertCanDeletePublicFile,
  assertCanReadPublicFile,
  assertCanUpdatePublicFile,
  assertCanUploadToPublicFile,
} from '../../files/uploadFile/handler.test';
import PermissionItemQueries from '../../permissionItems/queries';
import {makePermissionItemInputsFromPublicAccessOps} from '../../permissionItems/utils';
import RequestData from '../../RequestData';
import {
  assertContext,
  getTestBaseContext,
  IInsertOrganizationForTestResult,
  IInsertUserForTestResult,
  insertFolderForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import FolderQueries from '../queries';
import {folderExtractor} from '../utils';
import {INewFolderInput} from './types';

/**
 * TODO:
 * - Test different folder paths
 * - Test on root
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

const addFolderBaseTest = async (
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  assertContext(context);
  insertUserResult = insertUserResult || (await insertUserForTest(context));
  insertOrgResult =
    insertOrgResult ||
    (await insertOrganizationForTest(context, insertUserResult.userToken));

  const {folder} = await insertFolderForTest(
    context,
    insertUserResult.userToken,
    insertOrgResult.organization.resourceId,
    input
  );

  const savedFolder = await context.data.folder.assertGetItem(
    FolderQueries.getById(folder.resourceId)
  );

  expect(folder).toMatchObject(folderExtractor(savedFolder));
  return {folder, savedFolder, insertUserResult, insertOrgResult};
};

const addFolderWithPublicAccessOpsTest = async (
  input: Partial<INewFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  assertContext(context);
  const uploadResult = await addFolderBaseTest(input);
  const {savedFolder} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertOrgResult = uploadResult.insertOrgResult;
  expect(savedFolder.publicAccessOps).toHaveLength(
    input.publicAccessOps?.length || 0
  );

  const agent = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(
      mockExpressRequestWithUserToken(insertUserResult.userToken)
    )
  );

  expect(savedFolder.publicAccessOps).toContain(
    expect.arrayContaining(
      defaultTo(input.publicAccessOps, []).map(op => {
        return {
          action: op.action,
          resourceType: op.resourceType,
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
    savedFolder.resourceId,
    AppResourceType.Folder,
    savedFolder.publicAccessOps
  );

  expect(publicPresetPermissionitems).toContainEqual(
    expect.arrayContaining(basePermissionItems)
  );

  return uploadResult;
};

export async function assertCanReadPublicFolder(
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

export async function assertCanUploadToPublicFolder(
  organizationId: string,
  filePath: string
) {
  assertContext(context);
  await insertFileForTest(context, null, organizationId, {
    organizationId,
    path: filePath,
  });
}

export async function assertCanUpdatePublicFolder(
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

export async function assertCanDeletePublicFolder(
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

const testActions = {
  [AppResourceType.File]: {
    [BasicCRUDActions.All]: [
      assertCanUploadToPublicFile,
      assertCanReadPublicFile,
      assertCanUpdatePublicFile,
      assertCanDeletePublicFile,
    ],
    [BasicCRUDActions.Create]: [assertCanUploadToPublicFile],
    [BasicCRUDActions.Read]: [assertCanReadPublicFile],
    [BasicCRUDActions.Update]: [
      assertCanUpdatePublicFile,
      assertCanUploadToPublicFile,
    ],
    [BasicCRUDActions.Delete]: [assertCanDeletePublicFile],
  },
  [AppResourceType.Folder]: {
    [BasicCRUDActions.All]: [],
    [BasicCRUDActions.Create]: [],
    [BasicCRUDActions.Read]: [],
    [BasicCRUDActions.Update]: [],
    [BasicCRUDActions.Delete]: [],
  },
};

describe('addFolder', () => {
  test('folder created', async () => {
    await addFolderBaseTest();
  });
});
