import {PermissionGroupMatcher} from '../../../definitions/permissionGroups.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import getPermissionGroup from './handler.js';

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
