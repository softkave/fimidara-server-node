import {add, differenceInSeconds} from 'date-fns';
import * as faker from 'faker';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertOrganizationForTest,
  insertRequestForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import updateRequest from './handler';
import {IUpdateCollaborationRequestInput, IUpdateRequestParams} from './types';

test('collaboration request updated', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    organization.resourceId
  );

  const updateRequestInput: IUpdateCollaborationRequestInput = {
    message: faker.lorem.paragraph(),
    expiresAt: differenceInSeconds(add(Date.now(), {days: 1}), Date.now()),
  };

  const instData = RequestData.fromExpressRequest<IUpdateRequestParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      requestId: request01.resourceId,
      request: updateRequestInput,
    }
  );

  const result = await updateRequest(context, instData);
  assertEndpointResultOk(result);
  const updatedRequest = await context.data.collaborationRequest.assertGetItem(
    EndpointReusableQueries.getById(request01.resourceId)
  );

  expect(result.request.resourceId).toEqual(request01.resourceId);
  expect(result.request).toMatchObject(updateRequestInput);
  expect(updatedRequest).toMatchObject(updateRequestInput);
});
