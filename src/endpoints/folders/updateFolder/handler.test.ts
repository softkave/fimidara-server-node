import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertPublicAccessOps,
  assertPublicPermissionsDonotExistForOwner,
} from '../../files/uploadFile/handler.test';
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
import {
  assertPublicOps,
  makeEveryFolderPublicAccessOp,
} from '../addFolder/handler.test';
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
  ctx: IBaseContext,
  incomingUpdateInput: Partial<IUpdateFolderParams> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) {
  insertUserResult = insertUserResult || (await insertUserForTest(ctx));
  insertOrgResult =
    insertOrgResult ||
    (await insertOrganizationForTest(ctx, insertUserResult.userToken));

  const {folder} = await insertFolderForTest(
    ctx,
    insertUserResult.userToken,
    insertOrgResult.organization.resourceId
  );

  const updateInput: IUpdateFolderInput = {
    description: faker.lorem.words(20),
    maxFileSizeInBytes: 9_000_000_000,
    ...incomingUpdateInput,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderParams>(
    mockExpressRequestWithUserToken(insertUserResult.userToken),
    {
      organizationId: insertOrgResult.organization.resourceId,
      path: folder.name,
      folder: updateInput,
    }
  );

  const result = await updateFolder(ctx, instData);
  assertEndpointResultOk(result);
  expect(result.folder.resourceId).toEqual(folder.resourceId);
  expect(result.folder).toMatchObject(updateInput);
  const savedFolder = await ctx.data.folder.assertGetItem(
    FolderQueries.getById(folder.resourceId)
  );

  expect(folder).toMatchObject(folderExtractor(savedFolder));
  return {folder, savedFolder, insertUserResult, insertOrgResult};
}

const updateFolderWithPublicAccessOpsTest = async (
  ctx: IBaseContext,
  incomingUpdateInput: Partial<IUpdateFolderParams> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertOrgResult?: IInsertOrganizationForTestResult
) => {
  const uploadResult = await updateFolderBaseTest(ctx, incomingUpdateInput);
  const {savedFolder} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertOrgResult = uploadResult.insertOrgResult;
  expect(savedFolder.publicAccessOps).toHaveLength(
    incomingUpdateInput.folder?.publicAccessOps?.length || 0
  );

  await assertPublicAccessOps(
    ctx,
    savedFolder,
    insertUserResult,
    insertOrgResult,
    incomingUpdateInput?.folder?.publicAccessOps || []
  );

  return uploadResult;
};

describe('updateFolder', () => {
  test('folder updated', async () => {
    assertContext(context);
    await updateFolderBaseTest(context);
  });

  test('folder updated with public access ops', async () => {
    assertContext(context);
    const {savedFolder, insertOrgResult} =
      await updateFolderWithPublicAccessOpsTest(context, {
        folder: {
          publicAccessOps: makeEveryFolderPublicAccessOp(),
        },
      });

    await assertPublicOps(context, savedFolder, insertOrgResult);
  });

  test('folder public access ops removed', async () => {
    assertContext(context);
    await updateFolderWithPublicAccessOpsTest(context, {
      folder: {
        publicAccessOps: makeEveryFolderPublicAccessOp(),
      },
    });

    const {savedFolder, insertOrgResult} =
      await updateFolderWithPublicAccessOpsTest(context, {
        folder: {removePublicAccessOps: true},
      });

    await assertPublicOps(context, savedFolder, insertOrgResult);
    await assertPublicPermissionsDonotExistForOwner(
      context,
      insertOrgResult.organization,
      savedFolder.resourceId
    );
  });
});
