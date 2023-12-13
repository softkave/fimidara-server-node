import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteAgentToken from './handler';
import {DeleteAgentTokenEndpointParams} from './types';

/**
 * TODO:
 * - [Low] Check that onReferenced feature works
 */

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

test('Agent token deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {token} = await insertAgentTokenForTest(userToken, workspace.resourceId);
  const instData = RequestData.fromExpressRequest<DeleteAgentTokenEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {tokenId: token.resourceId, workspaceId: workspace.resourceId}
  );

  const result = await deleteAgentToken(instData);
  assertEndpointResultOk(result);

  if (result.jobId) {
    await executeJob(result.jobId);
    await waitForJob(result.jobId);
  }

  const deletedTokenExists = await kSemanticModels
    .agentToken()
    .existsByQuery(EndpointReusableQueries.getByResourceId(token.resourceId));

  expect(deletedTokenExists).toBeFalsy();
});
