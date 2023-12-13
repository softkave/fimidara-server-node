import {kSemanticModels} from '../../contexts/injectables';
import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
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

  if (result.jobId) {
    await executeJob(result.jobId);
    await waitForJob(result.jobId);
  }

  const deletedRequestExists = await kSemanticModels
    .collaborationRequest()
    .existsByQuery(EndpointReusableQueries.getByResourceId(request.resourceId));

  expect(deletedRequestExists).toBeFalsy();
});
