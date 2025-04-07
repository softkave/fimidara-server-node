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
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import deleteCollaborationRequest from './handler.js';
import {DeleteCollaborationRequestEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('collaboration request deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {request} = await insertRequestForTest(userToken, workspace.resourceId);
  const reqData =
    RequestData.fromExpressRequest<DeleteCollaborationRequestEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {requestId: request.resourceId}
    );

  const result = await deleteCollaborationRequest(reqData);
  assertEndpointResultOk(result);

  assert(result.jobId);
  const job = (await kIjxSemantic.job().getOneByQuery({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {$objMatch: {type: kFimidaraResourceType.CollaborationRequest}},
  })) as Job<DeleteResourceJobParams>;
  expect(job).toBeTruthy();
  expect(job?.params).toMatchObject({
    resourceId: request.resourceId,
    workspaceId: workspace.resourceId,
  });

  const dbItem = await kIjxSemantic
    .collaborationRequest()
    .getOneByQuery({resourceId: request.resourceId, isDeleted: true});
  expect(dbItem).toBeTruthy();
});
