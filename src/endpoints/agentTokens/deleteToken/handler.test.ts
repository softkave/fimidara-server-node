import assert from 'assert';
import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kFimidaraResourceType} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/testFns';
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
  const job = (await kSemanticModels.job().getOneByQuery({
    type: kJobType.deleteResource0,
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
