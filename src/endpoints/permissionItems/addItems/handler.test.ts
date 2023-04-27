import {faker} from '@faker-js/faker';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType, getWorkspaceActionList} from '../../../definitions/system';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
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

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('addItems', () => {
  test.only('permission items added', async () => {
    // TODO: add more tests for target and appliesTo

    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [
      {permissionGroup: pg01},
      {permissionGroup: pg02},
      {permissionGroup: pg03},
      {permissionGroup: pg04},
    ] = await Promise.all([
      insertPermissionGroupForTest(context, userToken, workspace.resourceId),
      insertPermissionGroupForTest(context, userToken, workspace.resourceId),
      insertPermissionGroupForTest(context, userToken, workspace.resourceId),
      insertPermissionGroupForTest(context, userToken, workspace.resourceId),
    ]);

    const grantAccess = faker.datatype.boolean();
    const completeWorkspaceActions = getWorkspaceActionList();
    const subsetWorkspaceActions = faker.helpers.arrayElements(completeWorkspaceActions);
    const completeWorkspaceActionsInputItems: PermissionItemInput[] = completeWorkspaceActions.map(
      action => ({
        grantAccess,
        action: action as AppActionType,
        target: {targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.Self,
      })
    );
    const subsetWorkspaceActionsInputItems: PermissionItemInput[] = subsetWorkspaceActions.map(
      action => ({
        grantAccess,
        action: action as AppActionType,
        target: {targetId: workspace.resourceId},
        appliesTo: PermissionItemAppliesTo.Self,
      })
    );

    const reqData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        items: completeWorkspaceActionsInputItems.concat(
          subsetWorkspaceActionsInputItems.map(nextItem => ({
            ...nextItem,
            entity: {entityId: [pg03.resourceId, pg04.resourceId]},
          }))
        ),
        workspaceId: workspace.resourceId,
        entity: {entityId: [pg01.resourceId, pg02.resourceId]},
      }
    );
    const result = await addPermissionItems(context, reqData);
    assertEndpointResultOk(result);
    await Promise.all(
      [pg01, pg02].map(pg =>
        canEntityPerformActionOnTargetId(
          context!,
          pg.resourceId,
          completeWorkspaceActions,
          workspace.resourceId,
          /** expected result */ grantAccess
        )
      )
    );
    await Promise.all(
      [pg03, pg04].map(pg =>
        canEntityPerformActionOnTargetId(
          context!,
          pg.resourceId,
          subsetWorkspaceActions,
          workspace.resourceId,
          /** expected result */ grantAccess
        )
      )
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
