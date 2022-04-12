import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
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
import {collabRequestExtractor} from '../utils';
import revokeRequest from './handler';
import {IRevokeRequestEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('collaboration request revoked', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {user: user02} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    workspace.resourceId,
    {
      recipientEmail: user02.email,
    }
  );

  const instData = RequestData.fromExpressRequest<IRevokeRequestEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      requestId: request01.resourceId,
    }
  );

  const result = await revokeRequest(context, instData);
  assertEndpointResultOk(result);
  const updatedRequest = await context.data.collaborationRequest.assertGetItem(
    EndpointReusableQueries.getById(request01.resourceId)
  );

  expect(result.request.resourceId).toEqual(request01.resourceId);
  expect(result.request).toMatchObject(collabRequestExtractor(updatedRequest));
  expect(
    updatedRequest.statusHistory[updatedRequest.statusHistory.length - 1]
  ).toMatchObject({
    status: CollaborationRequestStatusType.Revoked,
  });
});
