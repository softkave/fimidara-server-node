import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {collabRequestExtractor} from '../utils';
import respondToRequest from './handler';
import {IRespondToRequestParams} from './types';

/**
 * TODO:
 * - Check if user declined, the update is "declined"
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('collaboration request declined', async () => {
  assertContext(context);
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
    EndpointReusableQueries.getById(request01.resourceId)
  );

  expect(result.request.resourceId).toEqual(request01.resourceId);
  expect(result.request).toMatchObject(collabRequestExtractor(updatedRequest));
  expect(
    updatedRequest.statusHistory[updatedRequest.statusHistory.length - 1]
  ).toMatchObject({
    status: CollaborationRequestStatusType.Accepted,
  });
});
