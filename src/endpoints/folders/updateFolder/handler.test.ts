import {faker} from '@faker-js/faker';
import {Folder} from '../../../definitions/folder.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import EndpointReusableQueries from '../../queries.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  IInsertUserForTestResult,
  IInsertWorkspaceForTestResult,
  initTests,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {folderExtractor, stringifyFoldernamepath} from '../utils.js';
import updateFolder from './handler.js';
import {UpdateFolderEndpointParams, UpdateFolderInput} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

async function updateFolderBaseTest(
  incomingUpdateInput: Partial<UpdateFolderInput> = {},
  insertUserResult?: IInsertUserForTestResult,
  insertWorkspaceResult?: IInsertWorkspaceForTestResult,
  existingFolder?: Folder
) {
  insertUserResult = insertUserResult ?? (await insertUserForTest());
  insertWorkspaceResult =
    insertWorkspaceResult ?? (await insertWorkspaceForTest(insertUserResult.userToken));
  const {folder} = existingFolder
    ? {folder: existingFolder}
    : await insertFolderForTest(
        insertUserResult.userToken,
        insertWorkspaceResult.workspace
      );

  const updateInput: UpdateFolderInput = {
    description: faker.lorem.words(20),
    ...incomingUpdateInput,
  };

  const instData = RequestData.fromExpressRequest<UpdateFolderEndpointParams>(
    mockExpressRequestWithAgentToken(insertUserResult.userToken),
    {
      folderpath: stringifyFoldernamepath(
        folder,
        insertWorkspaceResult.workspace.rootname
      ),
      folder: updateInput,
    }
  );

  const result = await updateFolder(instData);
  assertEndpointResultOk(result);
  expect(result.folder.resourceId).toEqual(folder.resourceId);
  expect(result.folder).toMatchObject(folderExtractor(updateInput));
  const savedFolder = await kSemanticModels
    .folder()
    .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(folder.resourceId));

  expect(result.folder).toMatchObject(folderExtractor(savedFolder));
  return {
    savedFolder,
    insertUserResult,
    insertWorkspaceResult,
    folder: result.folder,
  };
}

// const updateFolderWithPublicAccessOpsTest = async (
//   ctx: Base
//   incomingUpdateInput: Partial<UpdateFolderInput> = {},
//   insertUserResult?: IInsertUserForTestResult,
//   insertWorkspaceResult?: IInsertWorkspaceForTestResult,
//   existingFolder?: Folder
// ) => {
//   const uploadResult = await updateFolderBaseTest(
//
//     incomingUpdateInput,
//     insertUserResult,
//     insertWorkspaceResult,
//     existingFolder
//   );

//   const {savedFolder} = uploadResult;
//   insertUserResult = uploadResult.insertUserResult;
//   insertWorkspaceResult = uploadResult.insertWorkspaceResult;
//   await assertPublicAccessOps(
//
//     savedFolder,
//     insertWorkspaceResult,
//     incomingUpdateInput.publicAccessOps ?? []
//   );
//   return uploadResult;
// };

describe('updateFolder', () => {
  test('folder updated', async () => {
    await updateFolderBaseTest();
  });

  // test('folder updated with public access ops', async () => {
  //
  //   const {savedFolder, insertWorkspaceResult} = await updateFolderWithPublicAccessOpsTest(
  //
  //     {publicAccessOps: makeEveryFolderPublicAccessOp()}
  //   );
  //   await assertFolderPublicOps( savedFolder, insertWorkspaceResult);
  // });

  // test('folder public access ops removed', async () => {
  //
  //   const {
  //     insertWorkspaceResult,
  //     insertUserResult,
  //     savedFolder: savedFolder01,
  //   } = await updateFolderWithPublicAccessOpsTest( {
  //     publicAccessOps: makeEveryFolderPublicAccessOp(),
  //   });

  //   const {savedFolder} = await updateFolderWithPublicAccessOpsTest(
  //
  //     {removePublicAccessOps: true},
  //     insertUserResult,
  //     insertWorkspaceResult,
  //     savedFolder01
  //   );

  //   await expectErrorThrown(async () => {
  //
  //     await assertFolderPublicOps( savedFolder, insertWorkspaceResult);
  //   }, [PermissionDeniedError.name]);

  //   await assertPublicPermissionsDonotExistForContainer(
  //
  //     insertWorkspaceResult.workspace,
  //     savedFolder.resourceId
  //   );
  // });
});
