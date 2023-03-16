import {CollaborationRequestStatusType} from '../../../definitions/collaborationRequest';
import {IBaseContext} from '../../contexts/types';
import {disposeGlobalUtils} from '../../globalUtils';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertRequestForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {collaborationRequestForUserExtractor} from '../utils';
import revokeCollaborationRequest from './handler';
import {IRevokeCollaborationRequestEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await disposeGlobalUtils();
  await context?.dispose();
});

test('collaboration request revoked', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {user: user02} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {request: request01} = await insertRequestForTest(
    context,
    userToken,
    workspace.resourceId,
    {recipientEmail: user02.email}
  );
  const instData = RequestData.fromExpressRequest<IRevokeCollaborationRequestEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {requestId: request01.resourceId}
  );
  const result = await revokeCollaborationRequest(context, instData);
  assertEndpointResultOk(result);
  const updatedRequest = await context.semantic.collaborationRequest.assertGetOneByQuery(
    EndpointReusableQueries.getByResourceId(request01.resourceId)
  );
  expect(result.request.resourceId).toEqual(request01.resourceId);
  expect(result.request).toMatchObject(collaborationRequestForUserExtractor(updatedRequest));
  expect(updatedRequest.status).toBe(CollaborationRequestStatusType.Revoked);
});
