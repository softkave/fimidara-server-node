import add from 'date-fns/add';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import * as faker from 'faker';
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
import updateRequest from './handler';
import {IUpdateCollaborationRequestInput, IUpdateRequestParams} from './types';

test('collaboration request updated', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    organization.organizationId
  );

  const updateRequestInput: IUpdateCollaborationRequestInput = {
    message: faker.lorem.paragraph(),
    expiresAtInSecsFromToday: differenceInSeconds(
      add(Date.now(), {days: 1}),
      Date.now()
    ),
  };

  const instData = RequestData.fromExpressRequest<IUpdateRequestParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      requestId: request01.requestId,
      request: updateRequestInput,
    }
  );

  const result = await updateRequest(context, instData);
  assertEndpointResultOk(result);
  const updatedRequest = await context.data.collaborationRequest.assertGetItem(
    CollaborationRequestQueries.getById(request01.requestId)
  );

  expect(result.request.requestId).toBe(request01.requestId);
  expect(result.request).toEqual(updateRequestInput);
  expect(updatedRequest).toEqual(updateRequestInput);
});
