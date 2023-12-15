import {PermissionGroupMatcher} from '../../../definitions/permissionGroups';
import {kSemanticModels} from '../../contexts/injectables';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deletePermissionGroup from './handler';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
