import assert from 'assert';
import {afterAll, beforeAll, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertAgentTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
  const {token} = await insertAgentTokenForTest(
    userToken,
    workspace.resourceId
  );
  const reqData =
    RequestData.fromExpressRequest<DeleteAgentTokenEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {tokenId: token.resourceId, workspaceId: workspace.resourceId}
    );

  const result = await deleteAgentToken(reqData);
  assertEndpointResultOk(result);

  assert(result.jobId);
  const job = (await kIjxSemantic.job().getOneByQuery({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {$objMatch: {type: kFimidaraResourceType.AgentToken}},
  })) as Job<DeleteResourceJobParams>;
  expect(job).toBeTruthy();
  expect(job?.params).toMatchObject({
    resourceId: token.resourceId,
    workspaceId: workspace.resourceId,
  });

  const dbItem = await kIjxSemantic
    .agentToken()
    .getOneByQuery({resourceId: token.resourceId, isDeleted: true});
  expect(dbItem).toBeTruthy();
});
