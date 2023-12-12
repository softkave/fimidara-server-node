import {PermissionGroupMatcher} from '../../../definitions/permissionGroups';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deletePermissionGroup from './handler';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

test('permissionGroup permission group deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {permissionGroup} = await insertPermissionGroupForTest(
    userToken,
    workspace.resourceId
  );
  const instData = RequestData.fromExpressRequest<PermissionGroupMatcher>(
    mockExpressRequestWithAgentToken(userToken),
    {
      permissionGroupId: permissionGroup.resourceId,
    }
  );
  const result = await deletePermissionGroup(instData);
  assertEndpointResultOk(result);
  const deletedPermissionGroupExists = await kSemanticModels
    .agentToken()
    .existsByQuery(EndpointReusableQueries.getByResourceId(permissionGroup.resourceId));
  expect(deletedPermissionGroupExists).toBeFalsy();
});
