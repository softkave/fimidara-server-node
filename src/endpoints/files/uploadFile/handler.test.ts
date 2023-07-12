import {File} from '../../../definitions/file';
import {UsageRecordCategory} from '../../../definitions/usageRecord';
import {getStringListQuery} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
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
import {stringifyFileNamePath} from '../utils';
import {UploadFileEndpointParams} from './types';
import {assertFileUpdated, uploadFileBaseTest} from './uploadFileTestUtils';

/**
 * TODO:
 * - Test multiple files with the same path but different extensions
 */

let context: BaseContextType | null = null;

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

  test('file updated when new data uploaded', async () => {
    assertContext(context);
    const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(context);
    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFileNamePath(savedFile, insertWorkspaceResult.workspace.rootname),
    };
    const {savedFile: updatedFile} = await uploadFileBaseTest(
      context,
      update,
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
    );
    await assertFileUpdated(context, insertUserResult.userToken, savedFile, updatedFile);
  });

  test('file not duplicated', async () => {
    assertContext(context);
    const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(context);
    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFileNamePath(savedFile, insertWorkspaceResult.workspace.rootname),
    };
    await uploadFileBaseTest(
      context,
      update,
      /* type */ 'txt',
      insertUserResult,
      insertWorkspaceResult
    );

    const files = await context.semantic.file.getManyByQuery({
      workspaceId: savedFile.workspaceId,
      extension: savedFile.extension,
      ...getStringListQuery<File>(savedFile.namePath, 'namePath'),
    });
    expect(files.length).toBe(1);
  });

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
