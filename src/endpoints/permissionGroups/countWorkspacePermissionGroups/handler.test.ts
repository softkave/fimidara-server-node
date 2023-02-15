import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertPermissionGroupListForTest} from '../../test-utils/generate-data/permissionGroup';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import countWorkspacePermissionGroups from './handler';
import {ICountWorkspacePermissionGroupsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countWorkspacePermissionGroups', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertPermissionGroupListForTest(context, 15, {
      workspaceId: workspace.resourceId,
    });
    const count = await context.data.permissiongroup.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const instData = RequestData.fromExpressRequest<ICountWorkspacePermissionGroupsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await countWorkspacePermissionGroups(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
