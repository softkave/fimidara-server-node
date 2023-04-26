import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import updateCollaborationRequest from './handler';
import {UpdateCollaborationRequestEndpointParams, UpdateCollaborationRequestInput} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('updateCollaborationRequest', () => {
  test('collaboration request updated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {request: request01} = await insertRequestForTest(
      context,
      userToken,
      workspace.resourceId
    );
    const updateCollaborationRequestInput: UpdateCollaborationRequestInput = {
      message: faker.lorem.paragraph(),
      expires: add(Date.now(), {days: 1}).valueOf(),
    };

    const instData = RequestData.fromExpressRequest<UpdateCollaborationRequestEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {requestId: request01.resourceId, request: updateCollaborationRequestInput}
    );
    const result = await updateCollaborationRequest(context, instData);
    assertEndpointResultOk(result);
    const updatedRequest = await context.semantic.collaborationRequest.assertGetOneByQuery(
      EndpointReusableQueries.getByResourceId(request01.resourceId)
    );

    expect(result.request.resourceId).toEqual(request01.resourceId);
    expect(result.request.message).toBe(updateCollaborationRequestInput.message);
    expect(result.request.expiresAt).not.toBe(request01.expiresAt);
    expect(updatedRequest.message).toBe(updateCollaborationRequestInput.message);
    expect(updatedRequest.expiresAt).not.toBe(request01.expiresAt);
  });
});
