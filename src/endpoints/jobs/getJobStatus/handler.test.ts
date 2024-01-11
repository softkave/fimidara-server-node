import RequestData from '../../RequestData';
import {generateAndInsertJobListForTest} from '../../testUtils/generate/job';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getJobStatus from './handler';

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
