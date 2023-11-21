import assert from 'assert';
import {UsageRecordCategoryMap} from '../../../definitions/usageRecord';
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
import {
  TimedNoopFilePersistenceProviderContext,
  assertFileUpdated,
  uploadFileBaseTest,
} from './uploadFileTestUtils';

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
    const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(
      context,
      /** seed */ {},
      /** type */ 'png'
    );
    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFileNamePath(
        savedFile,
        insertWorkspaceResult.workspace.rootname
      ),
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
    const {savedFile, insertUserResult, insertWorkspaceResult} = await uploadFileBaseTest(
      context
    );
    const update: Partial<UploadFileEndpointParams> = {
      filepath: stringifyFileNamePath(
        savedFile,
        insertWorkspaceResult.workspace.rootname
      ),
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
      namePath: {$all: savedFile.namePath, $size: savedFile.namePath.length},
    });
    expect(files.length).toBe(1);
  });

  test('file not saved if storage usage is exceeded', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);

    // Update usage locks
    await updateTestWorkspaceUsageLocks(context, workspace.resourceId, [
      UsageRecordCategoryMap.Storage,
    ]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await insertFileForTest(context, userToken, workspace);
    }, [UsageLimitExceededError.name]);
  });

  test('files not processed synchronously because of txn', async () => {
    const count = 5;
    const invocations = (
      await Promise.all(
        new Array(count).fill(0).map(() => invokeUploadFileAndReturnInvocation())
      )
    )
      .map((invocation, index) => ({...invocation, index}))
      .sort((i0, i1) => i0.endMs - i1.startMs)
      .map(invocation => {
        return invocation.index;
      });
    const inOrder = new Array(count).fill(0).map((v, index) => index);
    expect(invocations).not.toEqual(inOrder);
  });
});

async function invokeUploadFileAndReturnInvocation() {
  const context: BaseContextType = await initTestBaseContext();
  const fileBackend = new TimedNoopFilePersistenceProviderContext();
  context.fileBackend = fileBackend;

  const insertUserResult = await insertUserForTest(context);
  const insertWorkspaceResult = await insertWorkspaceForTest(
    context,
    insertUserResult.userToken
  );
  await insertFileForTest(
    context,
    insertUserResult.userToken,
    insertWorkspaceResult.workspace
  );

  const uploadFileInvocation = fileBackend.getLastInvocationForFn('uploadFile');
  assert(uploadFileInvocation);
  await context.dispose();
  return uploadFileInvocation;
}
