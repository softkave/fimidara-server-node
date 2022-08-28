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
import deleteRequest from './handler';
import {IDeleteRequestEndpointParams} from './types';

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
  const {request} = await insertRequestForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData = RequestData.fromExpressRequest<IDeleteRequestEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      requestId: request.resourceId,
    }
  );

  const result = await deleteRequest(context, instData);
  assertEndpointResultOk(result);
  const deletedRequestExists =
    await context.data.collaborationRequest.checkItemExists(
      EndpointReusableQueries.getById(request.resourceId)
    );

  expect(deletedRequestExists).toBeFalsy();
});
