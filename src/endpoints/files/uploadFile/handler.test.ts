import {BasicCRUDActions} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/BaseContext';
import {assertContext, getTestBaseContext} from '../../test-utils/test-utils';
import {
  IUploadFileEndpointParams,
  UploadFilePublicAccessActions,
} from './types';
import {folderConstants} from '../../folders/constants';
import {PermissionDeniedError} from '../../user/errors';
import {expectErrorThrown} from '../../test-utils/helpers/error';
import {
  assertCanDeletePublicFile,
  assertCanReadPublicFile,
  assertCanUpdatePublicFile,
  assertCanUploadToPublicFile,
  assertFileUpdated,
  assertPublicPermissionsDonotExistForOwner,
  uploadFileBaseTest,
  uploadFileWithPublicAccessActionTest,
} from './uploadFileTestUtils';
import {getFileName} from '../utils';

/**
 * TODO:
 * - test multiple files with the same path but different extensions
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('uploadFile', () => {
  test('file uploaded', async () => {
    assertContext(context);
    await uploadFileBaseTest(context);
  });

  test('file uploaded with public read access action', async () => {
    assertContext(context);
    const {file, insertWorkspaceResult} =
      await uploadFileWithPublicAccessActionTest(
        context,
        {publicAccessAction: UploadFilePublicAccessActions.Read},
        /* expectedPublicAccessOpsCount */ 1,
        [BasicCRUDActions.Read]
      );

    const filepath = file.namePath.join(folderConstants.nameSeparator);
    await expectErrorThrown(async () => {
      assertContext(context);
      await assertCanDeletePublicFile(
        context,
        insertWorkspaceResult.workspace.resourceId,
        filepath
      );
    }, [PermissionDeniedError.name]);

    await expectErrorThrown(async () => {
      assertContext(context);
      await assertCanUpdatePublicFile(
        context,
        insertWorkspaceResult.workspace.resourceId,
        filepath
      );
    }, [PermissionDeniedError.name]);
  });

  test('file uploaded with public read and update access action', async () => {
    assertContext(context);
    await uploadFileWithPublicAccessActionTest(
      context,
      {publicAccessAction: UploadFilePublicAccessActions.ReadAndUpdate},
      /* expectedPublicAccessOpsCount */ 3,
      [BasicCRUDActions.Read, BasicCRUDActions.Update, BasicCRUDActions.Create]
    );
  });

  test('file uploaded with public read, update and delete access action', async () => {
    assertContext(context);
    const {insertWorkspaceResult, file} =
      await uploadFileWithPublicAccessActionTest(
        context,
        {publicAccessAction: UploadFilePublicAccessActions.ReadUpdateAndDelete},
        /* expectedPublicAccessOpsCount */ 4,
        [
          BasicCRUDActions.Read,
          BasicCRUDActions.Update,
          BasicCRUDActions.Delete,
          BasicCRUDActions.Create,
        ]
      );

    const filepath = file.namePath.join(folderConstants.nameSeparator);
    await assertCanReadPublicFile(
      context,
      insertWorkspaceResult.workspace.resourceId,
      filepath
    );

    await assertCanUploadToPublicFile(
      context,
      insertWorkspaceResult.workspace.resourceId,
      filepath
    );

    await assertCanUpdatePublicFile(
      context,
      insertWorkspaceResult.workspace.resourceId,
      filepath
    );

    await assertCanDeletePublicFile(
      context,
      insertWorkspaceResult.workspace.resourceId,
      filepath
    );
  });

  test('file updated when new data uploaded', async () => {
    assertContext(context);
    const {savedFile, insertUserResult, insertWorkspaceResult} =
      await uploadFileBaseTest(context);
    const update: Partial<IUploadFileEndpointParams> = {
      filepath: getFileName(savedFile),
      publicAccessAction: UploadFilePublicAccessActions.Read,
    };

    const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
      context,
      update,
      /* expectedPublicAccessOpsCount */ 1,
      [BasicCRUDActions.Read],
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
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
    const {savedFile, insertUserResult, insertWorkspaceResult} =
      await uploadFileWithPublicAccessActionTest(
        context,
        {
          publicAccessAction: UploadFilePublicAccessActions.ReadUpdateAndDelete,
        },
        /* expectedPublicAccessOpsCount */ 4,
        [
          BasicCRUDActions.Read,
          BasicCRUDActions.Update,
          BasicCRUDActions.Delete,
          BasicCRUDActions.Create,
        ]
      );

    const update: Partial<IUploadFileEndpointParams> = {
      filepath: getFileName(savedFile),
      publicAccessAction: UploadFilePublicAccessActions.None,
    };

    const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
      context,
      update,
      /* expectedPublicAccessOpsCount */ 0,
      /* expectedActions */ [],
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
    );

    await assertFileUpdated(
      context,
      insertUserResult.userToken,
      savedFile,
      updatedFile
    );

    await assertPublicPermissionsDonotExistForOwner(
      context,
      insertWorkspaceResult.workspace,
      savedFile.resourceId
    );
  });
});
