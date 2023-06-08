import {PermissionGroupMatcher} from '../../../definitions/permissionGroups';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deletePermissionGroup from './handler';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
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
  const instData = RequestData.fromExpressRequest<PermissionGroupMatcher>(
    mockExpressRequestWithAgentToken(userToken),
    {
      permissionGroupId: permissionGroup.resourceId,
    }
  );
  const result = await deletePermissionGroup(context, instData);
  assertEndpointResultOk(result);
  const deletedPermissionGroupExists = await context.semantic.agentToken.existsByQuery(
    EndpointReusableQueries.getByResourceId(permissionGroup.resourceId)
  );
  expect(deletedPermissionGroupExists).toBeFalsy();
});
