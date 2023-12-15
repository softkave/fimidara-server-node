import assert from 'assert';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {executeJob, waitForJob} from '../../jobs/runner';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteWorkspace from './handler';
import EndpointReusableQueries from '../../queries';

/**
 * TODO:
 * - Confirm that workspace artifacts are deleted
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('workspace deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const result = await deleteWorkspace(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
      workspaceId: workspace.resourceId,
    })
  );
  assertEndpointResultOk(result);
  assert(result.jobId);
  await executeJob(result.jobId);
  await waitForJob(result.jobId);
  const savedWorkspace = await kSemanticModels
    .workspace()
    .getOneByQuery(EndpointReusableQueries.getByResourceId(workspace.resourceId));
  expect(savedWorkspace).toBeFalsy();
});
