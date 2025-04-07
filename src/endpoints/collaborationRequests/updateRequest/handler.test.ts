import {faker} from '@faker-js/faker';
import {add} from 'date-fns';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import updateCollaborationRequest from './handler.js';
import {
  UpdateCollaborationRequestEndpointParams,
  UpdateCollaborationRequestInput,
} from './types.js';

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

    const reqData =
      RequestData.fromExpressRequest<UpdateCollaborationRequestEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {
          requestId: request01.resourceId,
          request: updateCollaborationRequestInput,
        }
      );
    const result = await updateCollaborationRequest(reqData);
    assertEndpointResultOk(result);
    const updatedRequest = await kIjxSemantic
      .collaborationRequest()
      .assertGetOneByQuery({resourceId: request01.resourceId});

    expect(result.request.resourceId).toEqual(request01.resourceId);
    expect(result.request.message).toBe(
      updateCollaborationRequestInput.message
    );
    expect(result.request.expiresAt).not.toBe(request01.expiresAt);
    expect(updatedRequest.message).toBe(
      updateCollaborationRequestInput.message
    );
    expect(updatedRequest.expiresAt).not.toBe(request01.expiresAt);
  });
});
