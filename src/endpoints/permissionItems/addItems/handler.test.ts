import {faker} from '@faker-js/faker';
import {
  AppResourceType,
  BasicCRUDActions,
  getWorkspaceActionList,
} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {expectPermissionItemsPresent} from '../../testUtils/helpers/permissionItem';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import PermissionItemQueries from '../queries';
import addPermissionItems from './handler';
import {IAddPermissionItemsEndpointParams, INewPermissionItemInput} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('addItems', () => {
  test('permission items added', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );
    const items: INewPermissionItemInput[] = getWorkspaceActionList().map(action => ({
      action: action as BasicCRUDActions,
      grantAccess: faker.datatype.boolean(),
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    }));

    const instData = RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {items, workspaceId: workspace.resourceId, entityId: permissionGroup.resourceId}
    );
    const result = await addPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectPermissionItemsPresent(result.items, items);
  });

  test('permission items are not duplicated', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      context,
      userToken,
      workspace.resourceId
    );
    const itemsUniq: INewPermissionItemInput[] = getWorkspaceActionList().map(action => ({
      action: action as BasicCRUDActions,
      grantAccess: faker.datatype.boolean(),
      targetType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    }));
    const itemsDuplicated: INewPermissionItemInput[] = getWorkspaceActionList()
      .concat(getWorkspaceActionList())
      .map(action => ({
        action: action as BasicCRUDActions,
        grantAccess: faker.datatype.boolean(),
        targetType: AppResourceType.Workspace,
        targetId: workspace.resourceId,
      }));

    const instData = RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        items: itemsDuplicated,
        workspaceId: workspace.resourceId,
        entityId: permissionGroup.resourceId,
      }
    );

    // First insert
    await addPermissionItems(context, instData);

    // Second insert of the very same permission items as the first insert
    const result = await addPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectPermissionItemsPresent(result.items, itemsUniq);
    const permissionGroupItems = await context.data.permissionItem.getManyByQuery(
      PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
    );

    expect(permissionGroupItems.length).toBe(itemsUniq.length);
  });
});
