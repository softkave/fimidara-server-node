import {IPermissionGroupMatcher} from '../../../definitions/permissionGroups';
import {IBaseContext} from '../../contexts/BaseContext';
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
import ProgramAccessTokenQueries from '../queries';
import deletePermissionGroup from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('permissionGroup permission group deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {permissionGroup} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData = RequestData.fromExpressRequest<IPermissionGroupMatcher>(
    mockExpressRequestWithUserToken(userToken),
    {
      permissionGroupId: permissionGroup.resourceId,
    }
  );

  const result = await deletePermissionGroup(context, instData);
  assertEndpointResultOk(result);

  const deletedPermissionGroupExists =
    await context.data.programAccessToken.checkItemExists(
      ProgramAccessTokenQueries.getById(permissionGroup.resourceId)
    );

  expect(deletedPermissionGroupExists).toBeFalsy();
});
