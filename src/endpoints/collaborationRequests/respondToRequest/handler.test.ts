import {kCollaborationRequestStatusTypeMap} from '../../../definitions/collaborationRequest';
import {EmailJobParams, Job, kEmailJobType, kJobType} from '../../../definitions/job';
import {DataQuery} from '../../contexts/data/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
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
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('collaboration request declined', async () => {
  const {userToken, user} = await insertUserForTest();
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
        response: kCollaborationRequestStatusTypeMap.Accepted,
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
  expect(updatedRequest.status).toBe(kCollaborationRequestStatusTypeMap.Accepted);

  await kUtilsInjectables.promises().flush();
  // const query: DataQuery<EmailMessage<CollaborationRequestEmailMessageParams>> = {
  //   type: kEmailJobType.collaborationRequestResponse,
  //   emailAddress: {$all: [user.email]},
  //   userId: {$all: [user.resourceId]},
  //   params: {$objMatch: {requestId: request01.resourceId}},
  // };
  // const dbEmailMessage = await kSemanticModels.emailMessage().getOneByQuery(query);
  // expect(dbEmailMessage).toBeTruthy();

  const query: DataQuery<Job<EmailJobParams>> = {
    type: kJobType.email,
    params: {
      $objMatch: {
        type: kEmailJobType.collaborationRequestResponse,
        emailAddress: {$all: [user.email]},
        userId: {$all: [user.resourceId]},
        params: {$objMatch: {requestId: request01.resourceId}},
      },
    },
  };
  const dbJob = await kSemanticModels.job().getOneByQuery(query);
  expect(dbJob).toBeTruthy();
});
