import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {IBaseContext} from '../../contexts/BaseContext';
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
import updateRequest from './handler';
import {
  IUpdateCollaborationRequestInput,
  IUpdateRequestEndpointParams,
} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('collaboration request updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const updateRequestInput: IUpdateCollaborationRequestInput = {
    message: faker.lorem.paragraph(),
    expires: add(Date.now(), {days: 1}).toISOString(),
  };

  const instData = RequestData.fromExpressRequest<IUpdateRequestEndpointParams>(
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
