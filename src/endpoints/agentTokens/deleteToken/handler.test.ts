import assert from 'assert';
import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import RequestData from '../../RequestData.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import deleteAgentToken from './handler.js';
import {DeleteAgentTokenEndpointParams} from './types.js';

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
  const job = (await kSemanticModels.job().getOneByQuery({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {$objMatch: {type: kFimidaraResourceType.AgentToken}},
  })) as Job<DeleteResourceJobParams>;
  expect(job).toBeTruthy();
  expect(job?.params).toMatchObject({
    resourceId: token.resourceId,
    workspaceId: workspace.resourceId,
  });

  const dbItem = await kSemanticModels
    .agentToken()
    .getOneByQuery({resourceId: token.resourceId, isDeleted: true});
  expect(dbItem).toBeTruthy();
});
