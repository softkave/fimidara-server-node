import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteCollaborationRequest from './handler';
import {IDeleteCollaborationRequestEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('collaboration request deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {request} = await insertRequestForTest(context, userToken, workspace.resourceId);
  const instData = RequestData.fromExpressRequest<IDeleteCollaborationRequestEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {requestId: request.resourceId}
  );

  const result = await deleteCollaborationRequest(context, instData);
  assertEndpointResultOk(result);
  const deletedRequestExists = await context.data.collaborationRequest.existsByQuery(
    EndpointReusableQueries.getById(request.resourceId)
  );

  expect(deletedRequestExists).toBeFalsy();
});
