import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {waitTimeout} from '../../../utils/fns.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import RequestData from '../../RequestData.js';
import {NotFoundError} from '../../errors.js';
import readFile from '../../files/readFile/handler.js';
import {ReadFileEndpointParams} from '../../files/readFile/types.js';
import {stringifyFilenamepath} from '../../files/utils.js';
import {addRootnameToPath} from '../../folders/utils.js';
import {generateTestFileName} from '../../testHelpers/generate/file.js';
import {expectErrorThrown} from '../../testHelpers/helpers/error.js';
import {expectFileBodyEqualById} from '../../testHelpers/helpers/file.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertAgentTokenForTest,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {PermissionDeniedError} from '../../users/errors.js';
import issuePresignedPath from './handler.js';
import {IssuePresignedPathEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('issuePresignedPath', () => {
  test('file presigned path issued', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const reqData =
      RequestData.fromExpressRequest<IssuePresignedPathEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {filepath: stringifyFilenamepath(file, workspace.rootname)}
      );
    const result = await issuePresignedPath(reqData);
    assertEndpointResultOk(result);

    const readFileResult = await tryReadFile(result.path);
    await expectFileBodyEqualById(file.resourceId, readFileResult.stream);
  });

  test('issued with fileId', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const reqData =
      RequestData.fromExpressRequest<IssuePresignedPathEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {fileId: file.resourceId}
      );
    const result = await issuePresignedPath(reqData);
    assertEndpointResultOk(result);

    const readFileResult = await tryReadFile(result.path);
    await expectFileBodyEqualById(file.resourceId, readFileResult.stream);
  });

  test('file presigned path issued with duration', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const duration = 1000; // 1 sec
    const reqData =
      RequestData.fromExpressRequest<IssuePresignedPathEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          duration,
          filepath: stringifyFilenamepath(file, workspace.rootname),
        }
      );
    const result = await issuePresignedPath(reqData);
    assertEndpointResultOk(result);

    await waitTimeout(duration);
    await expectReadFileFails(result.path, NotFoundError.name);
  });

  test('file presigned path issued with expiration timestamp', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const duration = 1000; // 1 sec
    const expires = Date.now() + duration;
    const reqData =
      RequestData.fromExpressRequest<IssuePresignedPathEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          expires,
          filepath: stringifyFilenamepath(file, workspace.rootname),
        }
      );
    const result = await issuePresignedPath(reqData);
    assertEndpointResultOk(result);

    await waitTimeout(duration);
    await expectReadFileFails(result.path, NotFoundError.name);
  });

  test('file presigned path issued with usage count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);

    const usageCount = 2;
    const reqData =
      RequestData.fromExpressRequest<IssuePresignedPathEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          usageCount,
          filepath: stringifyFilenamepath(file, workspace.rootname),
        }
      );
    const result = await issuePresignedPath(reqData);
    assertEndpointResultOk(result);

    // First 2 reads should succeed
    await tryReadFile(result.path);
    await tryReadFile(result.path);

    // 3rd read should fail
    await expectReadFileFails(result.path, NotFoundError.name);
  });

  test('fails if agent does not have permission', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {file} = await insertFileForTest(userToken, workspace);
    const {token} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId
    );

    await expectErrorThrown(async () => {
      const usageCount = 2;
      const reqData =
        RequestData.fromExpressRequest<IssuePresignedPathEndpointParams>(
          mockExpressRequestWithAgentToken(token),
          {
            usageCount,
            filepath: stringifyFilenamepath(file, workspace.rootname),
          }
        );
      await issuePresignedPath(reqData);
    }, [PermissionDeniedError.name]);
  });

  test('fails if agent does not have permission and file does not exist', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {folder} = await insertFolderForTest(userToken, workspace);
    const {token} = await insertAgentTokenForTest(
      userToken,
      workspace.resourceId
    );

    const filepath = addRootnameToPath(
      folder.namepath.join('/') + `/${faker.lorem.word()}`,
      workspace.rootname
    );

    await expectErrorThrown(async () => {
      const reqData =
        RequestData.fromExpressRequest<IssuePresignedPathEndpointParams>(
          mockExpressRequestWithAgentToken(token),
          {filepath}
        );
      await issuePresignedPath(reqData);
    }, [PermissionDeniedError.name]);
  });

  test('passes if file does not exist yet', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {folder} = await insertFolderForTest(userToken, workspace);

    const filepath = addRootnameToPath(
      folder.namepath.join('/') +
        `/${generateTestFileName({includeStraySlashes: true})}`,
      workspace.rootname
    );
    const reqData =
      RequestData.fromExpressRequest<IssuePresignedPathEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {filepath}
      );
    const result = await issuePresignedPath(reqData);
    assertEndpointResultOk(result);

    // Read should fail seeing file does not exist
    await expectReadFileFails(result.path, NotFoundError.name);

    // Insert file, so read should pass now
    await insertFileForTest(userToken, workspace, {filepath});
    await tryReadFile(result.path);
  });

  test('fails if file does not exist and filepath not provided', async () => {
    const {userToken} = await insertUserForTest();

    await expectErrorThrown(async () => {
      const reqData =
        RequestData.fromExpressRequest<IssuePresignedPathEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {fileId: getNewIdForResource(kFimidaraResourceType.File)}
        );
      await issuePresignedPath(reqData);
    }, [NotFoundError.name]);
  });
});

async function tryReadFile(presignedPath: string) {
  const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {filepath: presignedPath}
  );
  return await readFile(reqData);
}

async function expectReadFileFails(presignedPath: string, errorName: string) {
  await expectErrorThrown(async () => {
    const reqData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
      mockExpressRequestForPublicAgent(),
      {filepath: presignedPath}
    );
    await readFile(reqData);
  }, [errorName]);
}
