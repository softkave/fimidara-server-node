import {waitTimeout} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {addRootnameToPath} from '../../folders/utils';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {assertFileBodyEqual} from '../../testUtils/helpers/file';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertAgentTokenForTest,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import {fileConstants} from '../constants';
import readFile from '../readFile/handler';
import {ReadFileEndpointParams} from '../readFile/types';
import issueFilePresignedPath from './handler';
import {IssueFilePresignedPathEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('issueFilePresignedPath', () => {
  test('file presigned path issued', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);

    const instData = RequestData.fromExpressRequest<IssueFilePresignedPathEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        filepath: addRootnameToPath(
          file.name + fileConstants.nameExtensionSeparator + file.extension,
          workspace.rootname
        ),
      }
    );
    const result = await issueFilePresignedPath(context, instData);
    assertEndpointResultOk(result);

    const readFileResult = await tryReadFile(result.path);
    await assertFileBodyEqual(context, file.resourceId, readFileResult.stream);
  });

  test('file presigned path issued with duration', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);

    const duration = 1000; // 1 sec
    const instData = RequestData.fromExpressRequest<IssueFilePresignedPathEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        duration,
        filepath: addRootnameToPath(
          file.name + fileConstants.nameExtensionSeparator + file.extension,
          workspace.rootname
        ),
      }
    );
    const result = await issueFilePresignedPath(context, instData);
    assertEndpointResultOk(result);

    await waitTimeout(duration);
    await expectReadFileFails(result.path);
  });

  test('file presigned path issued with expiration timestamp', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);

    const duration = 1000; // 1 sec
    const expires = Date.now() + duration;
    const instData = RequestData.fromExpressRequest<IssueFilePresignedPathEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        expires,
        filepath: addRootnameToPath(
          file.name + fileConstants.nameExtensionSeparator + file.extension,
          workspace.rootname
        ),
      }
    );
    const result = await issueFilePresignedPath(context, instData);
    assertEndpointResultOk(result);

    await waitTimeout(duration);
    await expectReadFileFails(result.path);
  });

  test('file presigned path issued with usage count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);

    const usageCount = 2;
    const instData = RequestData.fromExpressRequest<IssueFilePresignedPathEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        usageCount,
        filepath: addRootnameToPath(
          file.name + fileConstants.nameExtensionSeparator + file.extension,
          workspace.rootname
        ),
      }
    );
    const result = await issueFilePresignedPath(context, instData);
    assertEndpointResultOk(result);

    // First 2 reads should succeed
    await tryReadFile(result.path);
    await tryReadFile(result.path);

    // 3rd read should fail
    await expectReadFileFails(result.path);
  });

  test('fails if agent does not have permission', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);
    const {token} = await insertAgentTokenForTest(context, userToken, workspace.resourceId);

    await expectErrorThrown(async () => {
      assertContext(context);
      const usageCount = 2;
      const instData = RequestData.fromExpressRequest<IssueFilePresignedPathEndpointParams>(
        mockExpressRequestWithAgentToken(token),
        {
          usageCount,
          filepath: addRootnameToPath(
            file.name + fileConstants.nameExtensionSeparator + file.extension,
            workspace.rootname
          ),
        }
      );
      await issueFilePresignedPath(context, instData);
    }, [PermissionDeniedError.name]);
  });
});

async function tryReadFile(presignedPath: string) {
  assertContext(context);
  const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {filepath: presignedPath}
  );
  return await readFile(context, instData);
}

async function expectReadFileFails(presignedPath: string) {
  await expectErrorThrown(async () => {
    assertContext(context);
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {filepath: presignedPath}
    );
    await readFile(context, instData);
  }, [PermissionDeniedError.name]);
}
