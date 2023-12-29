import assert from 'assert';
import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
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
  await initTests();
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

  assert(result.jobId);
  const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {$objMatch: {type: kAppResourceType.AgentToken}},
  });
  expect(job).toBeTruthy();
  expect(job?.params.args).toMatchObject({
    resourceId: token.resourceId,
    workspaceId: workspace.resourceId,
  });
});
