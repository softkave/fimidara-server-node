import {BaseContextType} from '../../contexts/types';
import {completeTest} from '../../testUtils/helpers/test';
import {assertContext, initTestBaseContext} from '../../testUtils/testUtils';
import {addFolderBaseTest} from './addFolderTestUtils';

/**
 * TODO:
 * - Test different folder paths
 * - Test on root
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('addFolder', () => {
  test('folder created', async () => {
    assertContext(context);
    await addFolderBaseTest(context);
  });

  // test('folder created with public access ops', async () => {
  //   assertContext(context);
  //   const {folder, insertWorkspaceResult} = await addFolderWithPublicAccessOpsTest(context, {
  //     publicAccessOps: [
  //       {
  //         action: AppActionType.Create,
  //         resourceType: AppResourceType.File,
  //       },
  //       {
  //         action: AppActionType.Read,
  //         resourceType: AppResourceType.File,
  //       },
  //       {
  //         action: AppActionType.Create,
  //         resourceType: AppResourceType.Folder,
  //       },
  //       {
  //         action: AppActionType.Read,
  //         resourceType: AppResourceType.Folder,
  //       },
  //     ],
  //   });

  //   const folderpath = folder.namePath.join(folderConstants.nameSeparator);
  //   const {folder: folder02} = await assertCanCreateFolderInPublicFolder(
  //     context,
  //     insertWorkspaceResult.workspace,
  //     folderpath
  //   );

  //   const folder02Path = folder02.namePath.join(folderConstants.nameSeparator);
  //   const {file} = await assertCanUploadToPublicFile(
  //     context,
  //     insertWorkspaceResult.workspace,
  //     folder02Path + folderConstants.nameSeparator + generateTestFolderName()
  //   );

  //   await assertCanListContentOfPublicFolder(
  //     context,
  //     insertWorkspaceResult.workspace,
  //     folder02Path
  //   );
  //   const filepath = file.namePath.join(folderConstants.nameSeparator);
  //   await assertCanReadPublicFile(context, insertWorkspaceResult.workspace, filepath);
  //   await expectErrorThrown(async () => {
  //     assertContext(context);
  //     await assertCanDeletePublicFolder(context, insertWorkspaceResult.workspace, folderpath);
  //   }, [PermissionDeniedError.name]);

  //   await expectErrorThrown(async () => {
  //     assertContext(context);
  //     await assertCanDeletePublicFile(context, insertWorkspaceResult.workspace, filepath);
  //   }, [PermissionDeniedError.name]);
  // });

  // test('folder created with all public access ops', async () => {
  //   assertContext(context);
  //   const {savedFolder, insertWorkspaceResult} = await addFolderWithPublicAccessOpsTest(context, {
  //     publicAccessOps: makeEveryFolderPublicAccessOp(),
  //   });

  //   await assertFolderPublicOps(context, savedFolder, insertWorkspaceResult);
  // });

  // test('folder created with all public access ops', async () => {
  //   assertContext(context);
  //   const {savedFolder, insertWorkspaceResult} = await addFolderWithPublicAccessOpsTest(context, {
  //     publicAccessOps: makeEveryFolderPublicAccessOp(),
  //   });

  //   await assertFolderPublicOps(context, savedFolder, insertWorkspaceResult);
  // });
});
