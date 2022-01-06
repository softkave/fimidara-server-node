import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import CollaborationRequestQueries from '../queries';
import deleteRequest from './handler';
import {IDeleteRequestParams} from './types';

test('collaboration request deleted', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {request} = await insertRequestForTest(
    context,
    userToken,
    organization.organizationId
  );

  const instData = RequestData.fromExpressRequest<IDeleteRequestParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      requestId: request.requestId,
    }
  );

  const result = await deleteRequest(context, instData);
  assertEndpointResultOk(result);
  const deletedRequestExists = await context.data.collaborationRequest.checkItemExists(
    CollaborationRequestQueries.getById(request.requestId)
  );

  expect(deletedRequestExists).toBeFalsy();
});
