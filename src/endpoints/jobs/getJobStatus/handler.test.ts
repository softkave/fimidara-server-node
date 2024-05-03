import RequestData from '../../RequestData.js';
import {generateAndInsertJobListForTest} from '../../testUtils/generate/job.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import getJobStatus from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getJobStatus', () => {
  test('getJobStatus', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [job] = await generateAndInsertJobListForTest(/** count */ 1, {
      workspaceId: workspace.resourceId,
    });

    const result = await getJobStatus(
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
        jobId: job.resourceId,
      })
    );
    assertEndpointResultOk(result);
    expect(result.status).toBe(job.status);
  });
});
