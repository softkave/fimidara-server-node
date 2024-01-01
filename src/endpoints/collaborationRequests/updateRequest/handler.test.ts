import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import updateCollaborationRequest from './handler';
import {
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestInput,
} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('updateCollaborationRequest', () => {
  test('collaboration request updated', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {request: request01} = await insertRequestForTest(
      userToken,
      workspace.resourceId
    );
    const updateCollaborationRequestInput: UpdateCollaborationRequestInput = {
      message: faker.lorem.paragraph(),
      expires: add(Date.now(), {days: 1}).valueOf(),
    };

    const instData =
      RequestData.fromExpressRequest<UpdateCollaborationRequestEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {requestId: request01.resourceId, request: updateCollaborationRequestInput}
      );
    const result = await updateCollaborationRequest(instData);
    assertEndpointResultOk(result);
    const updatedRequest = await kSemanticModels
      .collaborationRequest()
      .assertGetOneByQuery({resourceId: request01.resourceId});

    expect(result.request.resourceId).toEqual(request01.resourceId);
    expect(result.request.message).toBe(updateCollaborationRequestInput.message);
    expect(result.request.expiresAt).not.toBe(request01.expiresAt);
    expect(updatedRequest.message).toBe(updateCollaborationRequestInput.message);
    expect(updatedRequest.expiresAt).not.toBe(request01.expiresAt);
  });
});
