import {faker} from '@faker-js/faker';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppResourceType, BasicCRUDActions, getWorkspaceActionList} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {expectItemsPresent} from '../../test-utils/helpers/permissionItem';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
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
      appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
      targetType: AppResourceType.Workspace,
      permissionEntityId: permissionGroup.resourceId,
      permissionEntityType: AppResourceType.PermissionGroup,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    }));

    const instData = RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {items, workspaceId: workspace.resourceId}
    );

    const result = await addPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectItemsPresent(result.items, items);
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

    const items: INewPermissionItemInput[] = getWorkspaceActionList().map(action => ({
      action: action as BasicCRUDActions,
      grantAccess: faker.datatype.boolean(),
      appliesTo: PermissionItemAppliesTo.ContainerAndChildren,
      targetType: AppResourceType.Workspace,
      permissionEntityId: permissionGroup.resourceId,
      permissionEntityType: AppResourceType.PermissionGroup,
      containerId: workspace.resourceId,
      containerType: AppResourceType.Workspace,
      targetId: workspace.resourceId,
    }));

    const instData = RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {items, workspaceId: workspace.resourceId}
    );

    // First insert
    await addPermissionItems(context, instData);

    // Second insert of the very same permission items as the first
    // insert
    const result = await addPermissionItems(context, instData);
    assertEndpointResultOk(result);
    expectItemsPresent(result.items, items);
    const permissionGroupItems = await context.data.permissionItem.getManyByQuery(
      PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId, AppResourceType.PermissionGroup)
    );

    expect(permissionGroupItems.length).toBe(result.items.length);
  });
});
