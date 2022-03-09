import * as faker from 'faker';
import {defaultTo} from 'lodash';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
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
import updateFolder from './handler';
import {IUpdateFolderInput, IUpdateFolderParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

async function updateFolderBaseTest(
  input: Partial<IUpdateFolderParams> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) {
  assertContext(context);
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

  const updateInput: IUpdateFolderInput = {
    description: faker.lorem.words(20),
    maxFileSizeInBytes: 9_000_000_000,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderParams>(
    mockExpressRequestWithUserToken(insertUserResult.userToken),
    {
      organizationId: insertOrgResult.organization.resourceId,
      path: folder.name,
      folder: updateInput,
    }
  );

  const result = await updateFolder(context, instData);
  assertEndpointResultOk(result);
  expect(result.folder.resourceId).toEqual(folder.resourceId);
  expect(result.folder).toMatchObject(updateInput);
  const savedFolder = await context.data.folder.assertGetItem(
    FolderQueries.getById(folder.resourceId)
  );

  expect(folder).toMatchObject(folderExtractor(savedFolder));
  return {folder, savedFolder, insertUserResult, insertOrgResult};
}

const addFolderWithPublicAccessOpsTest = async (
  input: Partial<IUpdateFolderParams> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  assertContext(context);
  const uploadResult = await updateFolderBaseTest(input);
  const {savedFolder} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertOrgResult = uploadResult.insertOrgResult;
  expect(savedFolder.publicAccessOps).toHaveLength(
    input.folder?.publicAccessOps?.length || 0
  );

  const agent = await context.session.getAgent(
    context,
    RequestData.fromExpressRequest(
      mockExpressRequestWithUserToken(insertUserResult.userToken)
    )
  );

  expect(savedFolder.publicAccessOps).toContain(
    expect.arrayContaining(
      defaultTo(input?.folder?.publicAccessOps, []).map(op => {
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

describe('updateFolder', () => {
  test('folder updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {organization} = await insertOrganizationForTest(context, userToken);
    const {folder: folder01} = await insertFolderForTest(
      context,
      userToken,
      organization.resourceId
    );

    const updateInput: IUpdateFolderInput = {
      description: faker.lorem.words(20),
      maxFileSizeInBytes: 9_000_000_000,
    };

    const instData = RequestData.fromExpressRequest<IUpdateFolderParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
        path: folder01.name,
        folder: updateInput,
      }
    );

    const result = await updateFolder(context, instData);
    assertEndpointResultOk(result);
    expect(result.folder.resourceId).toEqual(folder01.resourceId);
    expect(result.folder).toMatchObject(updateInput);
  });
});
