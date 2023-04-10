import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {IBaseContext} from '../../contexts/types';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {updateTestWorkspaceUsageLocks} from '../../testUtils/helpers/usageRecord';
import {
  assertContext,
  initTestBaseContext,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';
import {UsageLimitExceededError} from '../../usageRecords/errors';
import {uploadFileBaseTest} from './uploadFileTestUtils';

/**
 * TODO:
 * - Test multiple files with the same path but different extensions
 * - Test uploading to an existing file
 */

let context: IBaseContext | null = null;

jest.setTimeout(300000); // 5 minutes
beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('uploadFile', () => {
  test('file uploaded', async () => {
    assertContext(context);
    await uploadFileBaseTest(context);
  });

  // test('file uploaded with public read access action', async () => {
  //   assertContext(context);
  //   const {file, insertWorkspaceResult} = await uploadFileWithPublicAccessActionTest(
  //     context,
  //     {publicAccessAction: UploadFilePublicAccessActions.Read},
  //     [AppActionType.Read]
  //   );

  //   const filepath = file.namePath.join(folderConstants.nameSeparator);
  //   await expectErrorThrown(async () => {
  //     assertContext(context);
  //     await assertCanDeletePublicFile(context, insertWorkspaceResult.workspace, filepath);
  //   }, [PermissionDeniedError.name]);

  //   await expectErrorThrown(async () => {
  //     assertContext(context);
  //     await assertCanUpdatePublicFile(context, insertWorkspaceResult.workspace, filepath);
  //   }, [PermissionDeniedError.name]);
  // });

  // test('file uploaded with public read and update access action', async () => {
  //   assertContext(context);
  //   await uploadFileWithPublicAccessActionTest(
  //     context,
  //     {publicAccessAction: UploadFilePublicAccessActions.ReadAndUpdate},
  //     [AppActionType.Read, AppActionType.Update, AppActionType.Create]
  //   );
  // });

  // test('file uploaded with public read, update and delete access action', async () => {
  //   assertContext(context);
  //   const {insertWorkspaceResult, file} = await uploadFileWithPublicAccessActionTest(
  //     context,
  //     {publicAccessAction: UploadFilePublicAccessActions.ReadUpdateAndDelete},
  //     [AppActionType.Read, AppActionType.Update, AppActionType.Delete, AppActionType.Create]
  //   );

  //   const filepath = file.namePath.join(folderConstants.nameSeparator);
  //   await assertCanReadPublicFile(context, insertWorkspaceResult.workspace, filepath);
  //   await assertCanUploadToPublicFile(context, insertWorkspaceResult.workspace, filepath);
  //   await assertCanUpdatePublicFile(context, insertWorkspaceResult.workspace, filepath);
  //   await assertCanDeletePublicFile(context, insertWorkspaceResult.workspace, filepath);
  // });

  // test('file updated when new data uploaded', async () => {
  //   assertContext(context);
  //   const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(context);
  //   const update: Partial<IUploadFileEndpointParams> = {
  //     filepath: addRootnameToPath(
  //       getFilePathWithoutRootname(savedFile),
  //       insertWorkspaceResult.workspace.rootname
  //     ),
  //     publicAccessAction: UploadFilePublicAccessActions.Read,
  //   };

  //   const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
  //     context,
  //     update,
  //     [AppActionType.Read],
  //     /* type */ 'txt',
  //     insertUserResult,
  //     insertWorkspaceResult
  //   );

  //   await assertFileUpdated(context, insertUserResult.userToken, savedFile, updatedFile);
  // });

  // test('public file updated and made non-public', async () => {
  //   assertContext(context);
  //   const {savedFile, insertUserResult, insertWorkspaceResult} =
  //     await uploadFileWithPublicAccessActionTest(
  //       context,
  //       {publicAccessAction: UploadFilePublicAccessActions.ReadUpdateAndDelete},
  //       [AppActionType.Read, AppActionType.Update, AppActionType.Delete, AppActionType.Create]
  //     );

  //   const update: Partial<IUploadFileEndpointParams> = {
  //     filepath: addRootnameToPath(
  //       getFilePathWithoutRootname(savedFile),
  //       insertWorkspaceResult.workspace.rootname
  //     ),
  //     publicAccessAction: UploadFilePublicAccessActions.None,
  //   };

  //   const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
  //     context,
  //     update,
  //     /* expectedActions */ [],
  //     /* type */ 'txt',
  //     insertUserResult,
  //     insertWorkspaceResult
  //   );

  //   await assertFileUpdated(context, insertUserResult.userToken, savedFile, updatedFile);
  //   await assertPublicPermissionsDonotExistForContainer(
  //     context,
  //     insertWorkspaceResult.workspace,
  //     savedFile.resourceId
  //   );
  // });

  test('file not saved if storage usage is exceeded', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);

    // Update usage locks
    await updateTestWorkspaceUsageLocks(context, workspace.resourceId, [
      UsageRecordCategory.Storage,
    ]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await insertFileForTest(context, userToken, workspace);
    }, [UsageLimitExceededError.name]);
  });
});
