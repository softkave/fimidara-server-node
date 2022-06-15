import {findItemWithField} from '../../../utilities/fns';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getWorkspacePermissionGroups from './handler';
import {IGetWorkspacePermissionGroupsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test("workspace's permissionGroups returned", async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {permissionGroup: permissionGroup01} =
    await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

  const {permissionGroup: permissionGroup02} =
    await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );

  const instData =
    RequestData.fromExpressRequest<IGetWorkspacePermissionGroupsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
      }
    );

  const result = await getWorkspacePermissionGroups(context, instData);
  assertEndpointResultOk(result);
  const resultPermissionGroup01 = findItemWithField(
    result.permissionGroups,
    permissionGroup01.resourceId,
    'resourceId'
  );

  const resultPermissionGroup02 = findItemWithField(
    result.permissionGroups,
    permissionGroup02.resourceId,
    'resourceId'
  );
  expect(resultPermissionGroup01).toMatchObject(permissionGroup01);
  expect(resultPermissionGroup02).toMatchObject(permissionGroup02);
});
