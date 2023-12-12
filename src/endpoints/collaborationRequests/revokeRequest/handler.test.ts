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
import revokeCollaborationRequest from './handler';
import {RevokeCollaborationRequestEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

test('collaboration request revoked', async () => {
  const {userToken} = await insertUserForTest();
  const {user: user02} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {request: request01} = await insertRequestForTest(
    userToken,
    workspace.resourceId,
    {recipientEmail: user02.email}
  );
  const instData =
    RequestData.fromExpressRequest<RevokeCollaborationRequestEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {requestId: request01.resourceId}
    );
  const result = await revokeCollaborationRequest(instData);
  assertEndpointResultOk(result);
  const updatedRequest = await kSemanticModels
    .collaborationRequest()
    .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(request01.resourceId));
  expect(result.request.resourceId).toEqual(request01.resourceId);
  expect(result.request).toMatchObject(
    collaborationRequestForUserExtractor(updatedRequest)
  );
  expect(updatedRequest.status).toBe(CollaborationRequestStatusTypeMap.Revoked);
});
