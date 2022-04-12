import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertRequestForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteRequest from './handler';
import {IDeleteRequestEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
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
