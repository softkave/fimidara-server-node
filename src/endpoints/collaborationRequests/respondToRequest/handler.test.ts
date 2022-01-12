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
import respondToRequest from './handler';
import {IRespondToRequestParams} from './types';

/**
 * TODO:
 * - Check if user declined, the update is "declined"
 */

test('collaboration request declined', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {user: user02, userToken: user02Token} = await insertUserForTest(
    context
  );

  const {organization} = await insertOrganizationForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    organization.resourceId,
    {
      recipientEmail: user02.email,
    }
  );

  const instData = RequestData.fromExpressRequest<IRespondToRequestParams>(
    mockExpressRequestWithUserToken(user02Token),
    {
      requestId: request01.resourceId,
      response: CollaborationRequestStatusType.Accepted,
    }
  );

  const result = await respondToRequest(context, instData);
  assertEndpointResultOk(result);
  const updatedRequest = await context.data.collaborationRequest.assertGetItem(
    CollaborationRequestQueries.getById(request01.resourceId)
  );

  expect(result.request.resourceId).toBe(request01.resourceId);
  expect(result.request).toBe(updatedRequest);
  expect(updatedRequest.statusHistory).toContain({
    status: CollaborationRequestStatusType.Accepted,
  });
});
