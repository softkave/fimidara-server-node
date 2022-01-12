import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import CollaborationRequestQueries from '../queries';
import revokeRequest from './handler';
import {IRevokeRequestParams} from './types';

test('collaboration request revoked', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {user: user02} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    organization.resourceId,
    {
      recipientEmail: user02.email,
    }
  );

  const instData = RequestData.fromExpressRequest<IRevokeRequestParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      requestId: request01.resourceId,
    }
  );

  const result = await revokeRequest(context, instData);
  assertEndpointResultOk(result);
  const updatedRequest = await context.data.collaborationRequest.assertGetItem(
    CollaborationRequestQueries.getById(request01.resourceId)
  );

  expect(result.request.resourceId).toBe(request01.resourceId);
  expect(result.request).toBe(updatedRequest);
  expect(updatedRequest.statusHistory).toContain({
    status: CollaborationRequestStatusType.Revoked,
  });
});
