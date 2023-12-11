import assert from 'assert';
import RequestData from '../../RequestData';
import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteWorkspace from './handler';

/**
 * TODO:
 * - Confirm that workspace artifacts are deleted
 */

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
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
