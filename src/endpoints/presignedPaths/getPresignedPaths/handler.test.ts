import assert from 'assert';
import {first} from 'lodash';
import {AgentToken} from '../../../definitions/agentToken';
import {File, FileMatcher} from '../../../definitions/file';
import {waitTimeout} from '../../../utils/fns';
import RequestData from '../../RequestData';
import readFile from '../../files/readFile/handler';
import {ReadFileEndpointParams} from '../../files/readFile/types';
import {stringifyFilenamepath} from '../../files/utils';
import {generateAndInsertTestFiles} from '../../testUtils/generate/file';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests, softkaveTest} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestForPublicAgent,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import issuePresignedPath from '../issuePresignedPath/handler';
import {IssuePresignedPathEndpointParams} from '../issuePresignedPath/types';
import getPresignedPathsForFiles from './handler';
import {GetPresignedPathsForFilesEndpointParams} from './types';

/**
 * - expired and spent
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getPresignedPathsForFiles', () => {
  softkaveTest.run('with file matcher', async () => {
    const {userToken} = await insertUserForTest();
    const [{workspace: w1}, {workspace: w2}] = await Promise.all([
      insertWorkspaceForTest(userToken),
      insertWorkspaceForTest(userToken),
    ]);
    const [files01, files02] = await Promise.all([
      generateAndInsertTestFiles(2, {
        workspaceId: w1.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(2, {
        workspaceId: w2.resourceId,
        parentId: null,
      }),
    ]);
    const paths = await issuePaths(
      userToken,
      files01.concat(files02).map(f => ({fileId: f.resourceId}))
    );

    const matchers: FileMatcher[] = toInterspersedMatchers(files01, w1.rootname).concat(
      toInterspersedMatchers(files02, w2.rootname)
    );
    const instData =
      RequestData.fromExpressRequest<GetPresignedPathsForFilesEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {files: matchers}
      );
    const result = await getPresignedPathsForFiles(instData);
    assertEndpointResultOk(result);

    const returnedPaths = result.paths.map(p => p.path);
    expect(returnedPaths).toEqual(expect.arrayContaining(paths));
  });

  softkaveTest.run('with file matcher and workspaceId', async () => {
    const {userToken} = await insertUserForTest();
    const [{workspace: w1}, {workspace: w2}] = await Promise.all([
      insertWorkspaceForTest(userToken),
      insertWorkspaceForTest(userToken),
    ]);
    const [files01, files02] = await Promise.all([
      generateAndInsertTestFiles(2, {
        workspaceId: w1.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(2, {
        workspaceId: w2.resourceId,
        parentId: null,
      }),
    ]);
    const [paths01, paths02] = await Promise.all([
      issuePaths(
        userToken,
        files01.map(f => ({fileId: f.resourceId}))
      ),
      issuePaths(
        userToken,
        files02.map(f => ({fileId: f.resourceId}))
      ),
    ]);

    const matchers: FileMatcher[] = toInterspersedMatchers(files01, w1.rootname).concat(
      toInterspersedMatchers(files02, w2.rootname)
    );
    const instData =
      RequestData.fromExpressRequest<GetPresignedPathsForFilesEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {files: matchers, workspaceId: w1.resourceId}
      );
    const result = await getPresignedPathsForFiles(instData);
    assertEndpointResultOk(result);

    const returnedPaths = result.paths.map(p => p.path);
    expect(returnedPaths).toEqual(expect.arrayContaining(paths01));
    expect(returnedPaths).toEqual(expect.not.arrayContaining(paths02));
  });

  softkaveTest.run('with workspaceId and agent token', async () => {
    const {userToken} = await insertUserForTest();
    const [{workspace: w1}, {workspace: w2}] = await Promise.all([
      insertWorkspaceForTest(userToken),
      insertWorkspaceForTest(userToken),
    ]);
    const [files01, files02] = await Promise.all([
      generateAndInsertTestFiles(2, {
        workspaceId: w1.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(2, {
        workspaceId: w2.resourceId,
        parentId: null,
      }),
    ]);
    const [paths01, paths02] = await Promise.all([
      issuePaths(
        userToken,
        files01.map(f => ({fileId: f.resourceId}))
      ),
      issuePaths(
        userToken,
        files02.map(f => ({fileId: f.resourceId}))
      ),
    ]);

    const instData =
      RequestData.fromExpressRequest<GetPresignedPathsForFilesEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: w1.resourceId}
      );
    const result = await getPresignedPathsForFiles(instData);
    assertEndpointResultOk(result);

    const returnedPaths = result.paths.map(p => p.path);
    expect(returnedPaths).toEqual(expect.arrayContaining(paths01));
    expect(returnedPaths).toEqual(expect.not.arrayContaining(paths02));
  });

  softkaveTest.run('with user token', async () => {
    const {userToken} = await insertUserForTest();
    const [{workspace: w1}, {workspace: w2}] = await Promise.all([
      insertWorkspaceForTest(userToken),
      insertWorkspaceForTest(userToken),
    ]);
    const [files01, files02] = await Promise.all([
      generateAndInsertTestFiles(2, {
        workspaceId: w1.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(2, {
        workspaceId: w2.resourceId,
        parentId: null,
      }),
    ]);
    const [expectedPaths] = await Promise.all([
      issuePaths(
        userToken,
        files01.concat(files02).map(f => ({fileId: f.resourceId}))
      ),
    ]);

    const instData =
      RequestData.fromExpressRequest<GetPresignedPathsForFilesEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {}
      );
    const result = await getPresignedPathsForFiles(instData);
    assertEndpointResultOk(result);

    const returnedPaths = result.paths.map(p => p.path);
    expect(returnedPaths).toEqual(expect.arrayContaining(expectedPaths));
  });

  softkaveTest.run('filters out expired and spent paths', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace: w1} = await insertWorkspaceForTest(userToken);
    const [files01, files02, files03] = await Promise.all([
      generateAndInsertTestFiles(1, {
        workspaceId: w1.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(1, {
        workspaceId: w1.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFiles(1, {
        workspaceId: w1.resourceId,
        parentId: null,
      }),
    ]);
    const [paths01, pathsWithDuration, pathsWithUsageCount] = await Promise.all([
      issuePaths(
        userToken,
        files01.map(f => ({fileId: f.resourceId}))
      ),
      issuePaths(
        userToken,
        files02.map(f => ({fileId: f.resourceId})),
        {duration: 1}
      ),
      issuePaths(
        userToken,
        files03.map(f => ({fileId: f.resourceId})),
        {usageCount: 1}
      ),
    ]);

    // Spend the usage count. Wrapped, expected to throw because the file does
    // not exist yet
    await expectErrorThrown(async () => {
      const spentPath = first(pathsWithUsageCount);
      assert(spentPath);
      await tryReadFile(spentPath);
    });

    // Wait 1ms for path with duration 1ms
    await waitTimeout(1);

    const instData =
      RequestData.fromExpressRequest<GetPresignedPathsForFilesEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: w1.resourceId}
      );
    const result = await getPresignedPathsForFiles(instData);
    assertEndpointResultOk(result);

    const returnedPaths = result.paths.map(p => p.path);
    expect(returnedPaths).toEqual(expect.arrayContaining(paths01));
    expect(returnedPaths).toEqual(expect.not.arrayContaining(pathsWithDuration));
    expect(returnedPaths).toEqual(expect.not.arrayContaining(pathsWithUsageCount));
  });
});

async function issuePaths(
  userToken: AgentToken,
  matchers: FileMatcher[],
  input?: IssuePresignedPathEndpointParams
) {
  const result = await Promise.all(
    matchers.map(async matcher => {
      const result = await issuePresignedPath(
        RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
          ...input,
          ...matcher,
        })
      );
      assertEndpointResultOk(result);
      return result;
    })
  );
  return result.map(r => r.path);
}

function toInterspersedMatchers(files: File[], rootname: string) {
  return files.map((f, i) =>
    i % 2 === 0 ? {fileId: f.resourceId} : {filepath: stringifyFilenamepath(f, rootname)}
  );
}

async function tryReadFile(presignedPath: string) {
  const instData = RequestData.fromExpressRequest<ReadFileEndpointParams>(
    mockExpressRequestForPublicAgent(),
    {filepath: presignedPath}
  );
  return await readFile(instData);
}
