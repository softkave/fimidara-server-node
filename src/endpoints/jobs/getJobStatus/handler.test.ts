import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import RequestData from '../../RequestData.js';
import {generateAndInsertJobListForTest} from '../../testHelpers/generate/job.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
      RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(userToken),
        {jobId: job.resourceId}
      )
    );

    assertEndpointResultOk(result);
    expect(result.status).toBe(job.status);
  });
});
