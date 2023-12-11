import {CollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {collaborationRequestForUserExtractor} from '../utils';
import respondToCollaborationRequest from './handler';
import {RespondToCollaborationRequestEndpointParams} from './types';

/**
 * TODO:
 * - Check if user declined, the update is "declined"
 */

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

test('collaboration request declined', async () => {
  const {userToken} = await insertUserForTest();
  const {user: user02, userToken: user02Token} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {request: request01} = await insertRequestForTest(
    userToken,
    workspace.resourceId,
    {recipientEmail: user02.email}
  );

  const instData =
    RequestData.fromExpressRequest<RespondToCollaborationRequestEndpointParams>(
      mockExpressRequestWithAgentToken(user02Token),
      {
        requestId: request01.resourceId,
        response: CollaborationRequestStatusTypeMap.Accepted,
      }
    );
  const result = await respondToCollaborationRequest(instData);
  assertEndpointResultOk(result);
  const updatedRequest = await kSemanticModels
    .collaborationRequest()
    .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(request01.resourceId));

  expect(result.request.resourceId).toEqual(request01.resourceId);
  expect(result.request).toMatchObject(
    collaborationRequestForUserExtractor(updatedRequest)
  );
  expect(updatedRequest.status).toBe(CollaborationRequestStatusTypeMap.Accepted);
});
