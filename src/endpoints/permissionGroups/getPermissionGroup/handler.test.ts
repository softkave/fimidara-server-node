import {PermissionGroupMatcher} from '../../../definitions/permissionGroups';
import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getPermissionGroup from './handler';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('referenced permissionGroup returned', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
    userToken,
    workspace.resourceId
  );

  const instData = RequestData.fromExpressRequest<PermissionGroupMatcher>(
    mockExpressRequestWithAgentToken(userToken),
    {permissionGroupId: permissionGroup.resourceId}
  );
  const result = await getPermissionGroup(instData);
  assertEndpointResultOk(result);
  expect(result.permissionGroup).toMatchObject(permissionGroup);
});
