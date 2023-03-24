import {faker} from '@faker-js/faker';
import {AppActionType, getWorkspaceActionList} from '../../../definitions/system';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {
  canEntityPerformAction01,
  checkExplicitAccessPermissions01,
} from '../../testUtils/helpers/permissionItem';
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
import PermissionItemQueries from '../queries';
import {IPermissionItemInput} from '../types';
import addPermissionItems from './handler';
import {IAddPermissionItemsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
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
    const items: IPermissionItemInput[] = getWorkspaceActionList().map(action => ({
      action: action as AppActionType,
      grantAccess: faker.datatype.boolean(),
      target: {targetId: workspace.resourceId},
    }));
    const reqData = RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {items, workspaceId: workspace.resourceId, entity: {entityId: permissionGroup.resourceId}}
    );
    const result = await addPermissionItems(context, reqData);
    assertEndpointResultOk(result);
    await canEntityPerformAction01(
      context,
      permissionGroup.resourceId,
      getWorkspaceActionList(),
      workspace.resourceId,
      /** expected result */ true
    );
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
    const grantAccess = faker.datatype.boolean();
    const itemsUniq: IPermissionItemInput[] = getWorkspaceActionList().map(action => ({
      grantAccess,
      action: action as AppActionType,
      target: {targetId: workspace.resourceId},
    }));
    const itemsDuplicated: IPermissionItemInput[] = getWorkspaceActionList()
      .concat(getWorkspaceActionList())
      .map(action => ({
        grantAccess,
        action: action as AppActionType,
        target: {targetId: workspace.resourceId},
      }));
    const reqData = RequestData.fromExpressRequest<IAddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        items: itemsDuplicated,
        workspaceId: workspace.resourceId,
        entity: {entityId: permissionGroup.resourceId},
      }
    );

    // First insert
    await addPermissionItems(context, reqData);

    // Second insert of the very same permission items as the first insert
    const result = await addPermissionItems(context, reqData);
    assertEndpointResultOk(result);
    await checkExplicitAccessPermissions01(
      context,
      permissionGroup.resourceId,
      getWorkspaceActionList(),
      workspace.resourceId,
      grantAccess
    );

    const permissionGroupItems = await context.semantic.permissionItem.getManyByLiteralDataQuery(
      PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
    );
    expect(permissionGroupItems.length).toBe(itemsUniq.length);
  });
});
