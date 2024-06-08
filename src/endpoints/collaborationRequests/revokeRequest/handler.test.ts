import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest.js';
import {Job, EmailJobParams, kJobType, kEmailJobType} from '../../../definitions/job.js';
import {DataQuery} from '../../contexts/data/types.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {collaborationRequestForUserExtractor} from '../utils.js';
import revokeCollaborationRequest from './handler.js';
import {RevokeCollaborationRequestEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
    .assertGetOneByQuery({resourceId: request01.resourceId});
  expect(result.request.resourceId).toEqual(request01.resourceId);
  expect(result.request).toMatchObject(
    collaborationRequestForUserExtractor(updatedRequest)
  );
  expect(updatedRequest.status).toBe(kCollaborationRequestStatusTypeMap.Revoked);

  await kUtilsInjectables.promises().flush();
  // const query: DataQuery<EmailMessage<CollaborationRequestEmailMessageParams>> = {
  //   type: kEmailMessageType.collaborationRequestRevoked,
  //   emailAddress: {$all: [user02.email]},
  //   params: {$objMatch: {requestId: request01.resourceId}},
  // };
  // const dbEmailMessage = await kSemanticModels.emailMessage().getOneByQuery(query);
  // expect(dbEmailMessage).toBeTruthy();

  const query: DataQuery<Job<EmailJobParams>> = {
    type: kJobType.email,
    params: {
      $objMatch: {
        type: kEmailJobType.collaborationRequestRevoked,
        emailAddress: {$all: [user02.email]},
        params: {$objMatch: {requestId: request01.resourceId}},
      },
    },
  };
  const dbJob = await kSemanticModels.job().getOneByQuery(query);
  expect(dbJob).toBeTruthy();
});
