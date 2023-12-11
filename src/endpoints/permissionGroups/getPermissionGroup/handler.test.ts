import {PermissionGroupMatcher} from '../../../definitions/permissionGroups';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getPermissionGroup from './handler';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
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
