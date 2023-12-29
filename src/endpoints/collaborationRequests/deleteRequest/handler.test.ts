import assert from 'assert';
import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteCollaborationRequest from './handler';
import {DeleteCollaborationRequestEndpointParams} from './types';

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
  const instData =
    RequestData.fromExpressRequest<DeleteCollaborationRequestEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {requestId: request.resourceId}
    );

  const result = await deleteCollaborationRequest(instData);
  assertEndpointResultOk(result);

  assert(result.jobId);
  const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {$objMatch: {type: kAppResourceType.CollaborationRequest}},
  });
  expect(job).toBeTruthy();
  expect(job?.params.args).toMatchObject({
    resourceId: request.resourceId,
    workspaceId: workspace.resourceId,
  });
});
