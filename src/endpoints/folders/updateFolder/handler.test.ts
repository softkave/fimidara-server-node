import {faker} from '@faker-js/faker';
import {IFolder} from '../../../definitions/folder';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  initTestBaseContext,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {folderConstants} from '../constants';
import {addRootnameToPath, folderExtractor} from '../utils';
import updateFolder from './handler';
import {IUpdateFolderEndpointParams, IUpdateFolderInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

async function updateFolderBaseTest(
  ctx: IBaseContext,
  incomingUpdateInput: Partial<IUpdateFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult,
  existingFolder?: IFolder
) {
  insertUserResult = insertUserResult ?? (await insertUserForTest(ctx));
  insertWorkspaceResult =
    insertWorkspaceResult ?? (await insertWorkspaceForTest(ctx, insertUserResult.userToken));
  const {folder} = existingFolder
    ? {folder: existingFolder}
    : await insertFolderForTest(ctx, insertUserResult.userToken, insertWorkspaceResult.workspace);

  const updateInput: IUpdateFolderInput = {
    description: faker.lorem.words(20),
    ...incomingUpdateInput,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderEndpointParams>(
    mockExpressRequestWithAgentToken(insertUserResult.userToken),
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
  const savedFolder = await ctx.semantic.folder.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(folder.resourceId)
  );

  expect(result.folder).toMatchObject(folderExtractor(savedFolder));
  return {
    savedFolder,
    insertUserResult,
    insertWorkspaceResult,
    folder: result.folder,
  };
}

// const updateFolderWithPublicAccessOpsTest = async (
//   ctx: IBaseContext,
//   incomingUpdateInput: Partial<IUpdateFolderInput> = {},
//   insertUserResult?: IInsertUserForTestResult,
//   insertWorkspaceResult?: IInsertWorkspaceForTestResult,
//   existingFolder?: IFolder
// ) => {
//   const uploadResult = await updateFolderBaseTest(
//     ctx,
//     incomingUpdateInput,
//     insertUserResult,
//     insertWorkspaceResult,
//     existingFolder
//   );

//   const {savedFolder} = uploadResult;
//   insertUserResult = uploadResult.insertUserResult;
//   insertWorkspaceResult = uploadResult.insertWorkspaceResult;
//   await assertPublicAccessOps(
//     ctx,
//     savedFolder,
//     insertWorkspaceResult,
//     incomingUpdateInput.publicAccessOps ?? []
//   );
//   return uploadResult;
// };

describe('updateFolder', () => {
  test('folder updated', async () => {
    assertContext(context);
    await updateFolderBaseTest(context);
  });

  // test('folder updated with public access ops', async () => {
  //   assertContext(context);
  //   const {savedFolder, insertWorkspaceResult} = await updateFolderWithPublicAccessOpsTest(
  //     context,
  //     {publicAccessOps: makeEveryFolderPublicAccessOp()}
  //   );
  //   await assertFolderPublicOps(context, savedFolder, insertWorkspaceResult);
  // });

  // test('folder public access ops removed', async () => {
  //   assertContext(context);
  //   const {
  //     insertWorkspaceResult,
  //     insertUserResult,
  //     savedFolder: savedFolder01,
  //   } = await updateFolderWithPublicAccessOpsTest(context, {
  //     publicAccessOps: makeEveryFolderPublicAccessOp(),
  //   });

  //   const {savedFolder} = await updateFolderWithPublicAccessOpsTest(
  //     context,
  //     {removePublicAccessOps: true},
  //     insertUserResult,
  //     insertWorkspaceResult,
  //     savedFolder01
  //   );

  //   await expectErrorThrown(async () => {
  //     assertContext(context);
  //     await assertFolderPublicOps(context, savedFolder, insertWorkspaceResult);
  //   }, [PermissionDeniedError.name]);

  //   await assertPublicPermissionsDonotExistForContainer(
  //     context,
  //     insertWorkspaceResult.workspace,
  //     savedFolder.resourceId
  //   );
  // });
});
