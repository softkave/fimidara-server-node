import {faker} from '@faker-js/faker';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType, getWorkspaceActionList} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {BaseContext} from '../../contexts/types';
import {
  canEntityPerformActionOnTargetId,
  checkExplicitAccessPermissionsOnTargetId,
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
import {PermissionItemInput} from '../types';
import addPermissionItems from './handler';
import {AddPermissionItemsEndpointParams} from './types';

let context: BaseContext | null = null;

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
    const items: PermissionItemInput[] = getWorkspaceActionList().map(action => ({
      action: action as AppActionType,
      grantAccess: faker.datatype.boolean(),
      target: {targetId: workspace.resourceId},
      appliesTo: PermissionItemAppliesTo.Self,
    }));
    const reqData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {items, workspaceId: workspace.resourceId, entity: {entityId: permissionGroup.resourceId}}
    );
    const result = await addPermissionItems(context, reqData);
    assertEndpointResultOk(result);
    await canEntityPerformActionOnTargetId(
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
    const itemsUniq: PermissionItemInput[] = getWorkspaceActionList().map(action => ({
      grantAccess,
      action: action as AppActionType,
      target: {targetId: workspace.resourceId},
      appliesTo: PermissionItemAppliesTo.Self,
    }));
    const itemsDuplicated: PermissionItemInput[] = getWorkspaceActionList()
      .concat(getWorkspaceActionList())
      .map(action => ({
        grantAccess,
        action: action as AppActionType,
        target: {targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.Self,
      }));
    const reqData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
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
    await checkExplicitAccessPermissionsOnTargetId(
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
