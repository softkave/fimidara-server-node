import {IBaseContext} from '../../contexts/types';
import {disposeGlobalUtils} from '../../globalUtils';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
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
import {IDeleteCollaborationRequestEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await disposeGlobalUtils();
  await context?.dispose();
});

test('collaboration request deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {request} = await insertRequestForTest(context, userToken, workspace.resourceId);
  const instData = RequestData.fromExpressRequest<IDeleteCollaborationRequestEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {requestId: request.resourceId}
  );

  const result = await deleteCollaborationRequest(context, instData);
  assertEndpointResultOk(result);
  const deletedRequestExists = await context.semantic.collaborationRequest.existsByQuery(
    EndpointReusableQueries.getByResourceId(request.resourceId)
  );

  expect(deletedRequestExists).toBeFalsy();
});
