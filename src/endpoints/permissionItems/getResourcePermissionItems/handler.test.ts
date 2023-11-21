import {faker} from '@faker-js/faker';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import {getResourceId} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generateData/permissionItem';
import {expectContainsExactly} from '../../testUtils/helpers/assertion';
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
import addPermissionItems from '../addItems/handler';
import {AddPermissionItemsEndpointParams} from '../addItems/types';
import {PermissionItemInput} from '../types';
import {default as getResourcePermissionItems} from './handler';
import {GetResourcePermissionItemsEndpointParams} from './types';
import {AppResourceTypeMap} from '../../../definitions/system';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe.skip('getResourcePermissionItems', () => {
  test('resource permission items returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [{permissionGroup: pg01}, {permissionGroup: pg02}] = await Promise.all([
      insertPermissionGroupForTest(context, userToken, workspace.resourceId),
      insertPermissionGroupForTest(context, userToken, workspace.resourceId),
    ]);
    const inputItems = Object.values(kPermissionsMap).map(
      (action): PermissionItemInput => ({
        action,
        access: faker.datatype.boolean(),
        target: {targetId: pg02.resourceId},
        entityId: pg01.resourceId,
      })
    );
    const addPermissionItemsReqData =
      RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {items: inputItems, workspaceId: workspace.resourceId}
      );
    const {items} = await addPermissionItems(context, addPermissionItemsReqData);
    const instData =
      RequestData.fromExpressRequest<GetResourcePermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId, target: {targetId: pg02.resourceId}}
      );
    const result = await getResourcePermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectContainsExactly(items, result.items, getResourceId);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertPermissionItemListForTest(context, 15, {
      workspaceId: workspace.resourceId,
      targetType: AppResourceTypeMap.Workspace,
      targetId: workspace.resourceId,
    });

    const instData =
      RequestData.fromExpressRequest<GetResourcePermissionItemsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId, target: {targetId: workspace.resourceId}}
      );
    const result = await getResourcePermissionItems(context, instData);
    assertEndpointResultOk(result);
  });
});
