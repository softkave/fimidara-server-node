import {faker} from '@faker-js/faker';
import {IFolder} from '../../../definitions/folder';
import {AppResourceType} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import {
  assertPublicAccessOps,
  assertPublicPermissionsDonotExistForOwner,
} from '../../files/uploadFile/uploadFileTestUtils';
import RequestData from '../../RequestData';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {
  assertContext,
  assertEndpointResultOk,
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  initTestBaseContext,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {PermissionDeniedError} from '../../user/errors';
import {
  assertPublicOps,
  makeEveryFolderPublicAccessOp,
} from '../addFolder/addFolderTestUtils';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {addRootnameToPath, folderExtractor} from '../utils';
import updateFolder from './handler';
import {IUpdateFolderEndpointParams, IUpdateFolderInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

async function updateFolderBaseTest(
  ctx: IBaseContext,
  incomingUpdateInput: Partial<IUpdateFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult,
  existingFolder?: IFolder
) {
  insertUserResult = insertUserResult || (await insertUserForTest(ctx));
  insertWorkspaceResult =
    insertWorkspaceResult ||
    (await insertWorkspaceForTest(ctx, insertUserResult.userToken));

  const {folder} = existingFolder
    ? {folder: existingFolder}
    : await insertFolderForTest(
        ctx,
        insertUserResult.userToken,
        insertWorkspaceResult.workspace
      );

  const updateInput: IUpdateFolderInput = {
    description: faker.lorem.words(20),
    maxFileSizeInBytes: 9_000_000_000,
    ...incomingUpdateInput,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderEndpointParams>(
    mockExpressRequestWithUserToken(insertUserResult.userToken),
    {
      folderpath: addRootnameToPath(
        folder.namePath.join(folderConstants.nameSeparator),
        insertWorkspaceResult.workspace.rootname
      ),
      folder: updateInput,
    }
  );

  const result = await updateFolder(ctx, instData);
  assertEndpointResultOk(result);
  expect(result.folder.resourceId).toEqual(folder.resourceId);
  expect(result.folder).toMatchObject(folderExtractor(updateInput));
  const savedFolder = await ctx.data.folder.assertGetItem(
    FolderQueries.getById(folder.resourceId)
  );

  expect(result.folder).toMatchObject(folderExtractor(savedFolder));
  return {
    savedFolder,
    insertUserResult,
    insertWorkspaceResult,
    folder: result.folder,
  };
}

const updateFolderWithPublicAccessOpsTest = async (
  ctx: IBaseContext,
  incomingUpdateInput: Partial<IUpdateFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult,
  existingFolder?: IFolder
) => {
  const uploadResult = await updateFolderBaseTest(
    ctx,
    incomingUpdateInput,
    insertUserResult,
    insertWorkspaceResult,
    existingFolder
  );

  const {savedFolder} = uploadResult;
  insertUserResult = uploadResult.insertUserResult;
  insertWorkspaceResult = uploadResult.insertWorkspaceResult;
  // expect(savedFolder.publicAccessOps).toHaveLength(
  //   incomingUpdateInput.publicAccessOps?.length || 0
  // );

  await assertPublicAccessOps(
    ctx,
    savedFolder,
    insertUserResult,
    insertWorkspaceResult,
    incomingUpdateInput.publicAccessOps || [],
    AppResourceType.Folder
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
    const {savedFolder, insertWorkspaceResult} =
      await updateFolderWithPublicAccessOpsTest(context, {
        publicAccessOps: makeEveryFolderPublicAccessOp(),
      });

    await assertPublicOps(context, savedFolder, insertWorkspaceResult);
  });

  test('folder public access ops removed', async () => {
    assertContext(context);
    const {
      insertWorkspaceResult,
      insertUserResult,
      savedFolder: savedFolder01,
    } = await updateFolderWithPublicAccessOpsTest(context, {
      publicAccessOps: makeEveryFolderPublicAccessOp(),
    });

    const {savedFolder} = await updateFolderWithPublicAccessOpsTest(
      context,
      {removePublicAccessOps: true},
      insertUserResult,
      insertWorkspaceResult,
      savedFolder01
    );

    await expectErrorThrown(async () => {
      assertContext(context);
      await assertPublicOps(context, savedFolder, insertWorkspaceResult);
    }, [PermissionDeniedError.name]);

    await assertPublicPermissionsDonotExistForOwner(
      context,
      insertWorkspaceResult.workspace,
      savedFolder.resourceId
    );
  });
});
