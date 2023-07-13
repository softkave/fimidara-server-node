import {faker} from '@faker-js/faker';
import {AppResourceType} from '../../../definitions/system';
import {waitTimeout} from '../../../utils/fns';
import {getNewIdForResource} from '../../../utils/resource';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {NotFoundError} from '../../errors';
import {addRootnameToPath} from '../../folders/utils';
import {generateTestFileName} from '../../testUtils/generateData/file';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {assertFileBodyEqual} from '../../testUtils/helpers/file';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertAgentTokenForTest,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import readFile from '../readFile/handler';
import {ReadFileEndpointParams} from '../readFile/types';
import {stringifyFileNamePath} from '../utils';
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
      {filepath: stringifyFileNamePath(file, workspace.rootname)}
    );
    const result = await issueFilePresignedPath(context, instData);
    assertEndpointResultOk(result);

    const readFileResult = await tryReadFile(result.path);
    await assertFileBodyEqual(context, file.resourceId, readFileResult.stream);
  });

  test('issued with fileId', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {file} = await insertFileForTest(context, userToken, workspace);

    const instData = RequestData.fromExpressRequest<IssueFilePresignedPathEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {fileId: file.resourceId}
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
        filepath: stringifyFileNamePath(file, workspace.rootname),
      }
    );
    const result = await issueFilePresignedPath(context, instData);
    assertEndpointResultOk(result);

    await waitTimeout(duration);
    await expectReadFileFails(result.path, PermissionDeniedError.name);
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
        filepath: stringifyFileNamePath(file, workspace.rootname),
      }
    );
    const result = await issueFilePresignedPath(context, instData);
    assertEndpointResultOk(result);

    await waitTimeout(duration);
    await expectReadFileFails(result.path, PermissionDeniedError.name);
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
        filepath: stringifyFileNamePath(file, workspace.rootname),
      }
    );
    const result = await issueFilePresignedPath(context, instData);
    assertEndpointResultOk(result);

    // First 2 reads should succeed
    await tryReadFile(result.path);
    await tryReadFile(result.path);

    // 3rd read should fail
    await expectReadFileFails(result.path, PermissionDeniedError.name);
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
          filepath: stringifyFileNamePath(file, workspace.rootname),
        }
      );
      await issueFilePresignedPath(context, instData);
    }, [PermissionDeniedError.name]);
  });

  test('fails if agent does not have permission and file does not exist', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {folder} = await insertFolderForTest(context, userToken, workspace);
    const {token} = await insertAgentTokenForTest(context, userToken, workspace.resourceId);

    const filepath = addRootnameToPath(
      folder.namePath.join('/') + `/${faker.lorem.word()}`,
      workspace.rootname
    );

    await expectErrorThrown(async () => {
      assertContext(context);
      const instData = RequestData.fromExpressRequest<IssueFilePresignedPathEndpointParams>(
        mockExpressRequestWithAgentToken(token),
        {filepath}
      );
      await issueFilePresignedPath(context, instData);
    }, [PermissionDeniedError.name]);
  });

  test('passes if file does not exist yet', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {folder} = await insertFolderForTest(context, userToken, workspace);

    const filepath = addRootnameToPath(
      folder.namePath.join('/') + `/${generateTestFileName({includeStraySlashes: true})}`,
      workspace.rootname
    );
    const instData = RequestData.fromExpressRequest<IssueFilePresignedPathEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {filepath}
    );
    const result = await issueFilePresignedPath(context, instData);
    assertEndpointResultOk(result);

    // Read should fail seeing file does not exist
    await expectReadFileFails(result.path, NotFoundError.name);

    // Insert file, so read should pass now
    await insertFileForTest(context, userToken, workspace, {filepath});
    await tryReadFile(result.path);
  });

  test('fails if file does not exist and filepath not provided', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);

    await expectErrorThrown(async () => {
      assertContext(context);
      const instData = RequestData.fromExpressRequest<IssueFilePresignedPathEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {fileId: getNewIdForResource(AppResourceType.File)}
      );
      await issueFilePresignedPath(context, instData);
    }, [NotFoundError.name]);
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

async function expectReadFileFails(presignedPath: string, errorName: string) {
  await expectErrorThrown(async () => {
    assertContext(context);
    const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {filepath: presignedPath}
    );
    await readFile(context, instData);
  }, [errorName]);
}
