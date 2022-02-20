import {add, differenceInSeconds} from 'date-fns';
import * as faker from 'faker';
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
import updateRequest from './handler';
import {IUpdateCollaborationRequestInput, IUpdateRequestParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('collaboration request updated', async () => {
  assertContext(context);
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
  expect(result.request.message).toBe(updateRequestInput.message);
  expect(result.request.expiresAt).not.toBe(request01.expiresAt);
  expect(updatedRequest.message).toBe(updateRequestInput.message);
  expect(updatedRequest.expiresAt).not.toBe(request01.expiresAt);
});
