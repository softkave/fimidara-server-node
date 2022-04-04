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
    const {file, insertOrgResult} = await uploadFileWithPublicAccessActionTest(
      context,
      {publicAccessActions: UploadFilePublicAccessActions.Read},
      /* expectedPublicAccessOpsCount */ 1,
      [BasicCRUDActions.Read]
    );

    const filePath = file.namePath.join(folderConstants.nameSeparator);
    await expectErrorThrown(async () => {
      assertContext(context);
      await assertCanDeletePublicFile(
        context,
        insertOrgResult.organization.resourceId,
        filePath
      );
    }, [PermissionDeniedError.name]);

    await expectErrorThrown(async () => {
      assertContext(context);
      await assertCanUpdatePublicFile(
        context,
        insertOrgResult.organization.resourceId,
        filePath
      );
    }, [PermissionDeniedError.name]);
  });

  test('file uploaded with public read and update access action', async () => {
    assertContext(context);
    await uploadFileWithPublicAccessActionTest(
      context,
      {publicAccessActions: UploadFilePublicAccessActions.ReadAndUpdate},
      /* expectedPublicAccessOpsCount */ 3,
      [BasicCRUDActions.Read, BasicCRUDActions.Update, BasicCRUDActions.Create]
    );
  });

  test('file uploaded with public read, update and delete access action', async () => {
    assertContext(context);
    const {insertOrgResult, file} = await uploadFileWithPublicAccessActionTest(
      context,
      {publicAccessActions: UploadFilePublicAccessActions.ReadUpdateAndDelete},
      /* expectedPublicAccessOpsCount */ 4,
      [
        BasicCRUDActions.Read,
        BasicCRUDActions.Update,
        BasicCRUDActions.Delete,
        BasicCRUDActions.Create,
      ]
    );

    const filePath = file.namePath.join(folderConstants.nameSeparator);
    await assertCanReadPublicFile(
      context,
      insertOrgResult.organization.resourceId,
      filePath
    );

    await assertCanUploadToPublicFile(
      context,
      insertOrgResult.organization.resourceId,
      filePath
    );

    await assertCanUpdatePublicFile(
      context,
      insertOrgResult.organization.resourceId,
      filePath
    );

    await assertCanDeletePublicFile(
      context,
      insertOrgResult.organization.resourceId,
      filePath
    );
  });

  test('file updated when new data uploaded', async () => {
    assertContext(context);
    const {savedFile, insertUserResult, insertOrgResult} =
      await uploadFileBaseTest(context);
    const update: Partial<IUploadFileEndpointParams> = {
      filePath: getFileName(savedFile),
      publicAccessActions: UploadFilePublicAccessActions.Read,
    };

    const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
      context,
      update,
      /* expectedPublicAccessOpsCount */ 1,
      [BasicCRUDActions.Read],
      /* type */ 'txt',
      insertUserResult,
      insertOrgResult
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
    const {savedFile, insertUserResult, insertOrgResult} =
      await uploadFileWithPublicAccessActionTest(
        context,
        {
          publicAccessActions:
            UploadFilePublicAccessActions.ReadUpdateAndDelete,
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
      filePath: getFileName(savedFile),
      publicAccessActions: UploadFilePublicAccessActions.None,
    };

    const {savedFile: updatedFile} = await uploadFileWithPublicAccessActionTest(
      context,
      update,
      /* expectedPublicAccessOpsCount */ 0,
      /* expectedActions */ [],
      /* type */ 'txt',
      insertUserResult,
      insertOrgResult
    );

    await assertFileUpdated(
      context,
      insertUserResult.userToken,
      savedFile,
      updatedFile
    );

    await assertPublicPermissionsDonotExistForOwner(
      context,
      insertOrgResult.organization,
      savedFile.resourceId
    );
  });
});
