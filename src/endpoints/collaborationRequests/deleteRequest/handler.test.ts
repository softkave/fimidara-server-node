import {BaseContextType} from '../../contexts/types';
import {executeJob, waitForJob} from '../../jobs/runner';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteCollaborationRequest from './handler';
import {DeleteCollaborationRequestEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('collaboration request deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {request} = await insertRequestForTest(context, userToken, workspace.resourceId);
  const instData = RequestData.fromExpressRequest<DeleteCollaborationRequestEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {requestId: request.resourceId}
  );

  const result = await deleteCollaborationRequest(context, instData);
  assertEndpointResultOk(result);
  await executeJob(context, result.jobId);
  await waitForJob(context, result.jobId);
  const deletedRequestExists = await context.semantic.collaborationRequest.existsByQuery(
    EndpointReusableQueries.getByResourceId(request.resourceId)
  );

  expect(deletedRequestExists).toBeFalsy();
});
