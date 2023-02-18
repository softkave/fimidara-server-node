import {IPermissionGroupMatcher} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getPermissionGroup from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('referenced permissionGroup returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData = RequestData.fromExpressRequest<IPermissionGroupMatcher>(
    mockExpressRequestWithUserToken(userToken),
    {permissionGroupId: permissionGroup.resourceId}
  );
  const result = await getPermissionGroup(context, instData);
  assertEndpointResultOk(result);
  expect(result.permissionGroup).toMatchObject(permissionGroup);
});
