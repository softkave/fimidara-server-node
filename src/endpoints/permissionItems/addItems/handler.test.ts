import {faker} from '@faker-js/faker';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {expectEntityHavePermissionsTargetingId} from '../../testUtils/helpers/permissionItem';
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
  test('permission items added', async () => {
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
    const completeWorkspaceActions = Object.values(kPermissionsMap);
    const subsetWorkspaceActions = faker.helpers.arrayElements(completeWorkspaceActions);
    const completeWorkspaceActionsInputItems = completeWorkspaceActions.map(
      (action): PermissionItemInput => ({
        action,
        access: grantAccess,
        target: {targetId: workspace.resourceId},
        entityId: [pg01.resourceId, pg02.resourceId],
      })
    );
    const subsetWorkspaceActionsInputItems = subsetWorkspaceActions.map(
      (action): PermissionItemInput => ({
        action,
        access: grantAccess,
        target: {targetId: workspace.resourceId},
        entityId: [pg01.resourceId, pg02.resourceId, pg03.resourceId, pg04.resourceId],
      })
    );

    const reqData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {
        items: completeWorkspaceActionsInputItems.concat(
          subsetWorkspaceActionsInputItems
        ),
        workspaceId: workspace.resourceId,
      }
    );
    const result = await addPermissionItems(context, reqData);
    assertEndpointResultOk(result);
    await Promise.all(
      [pg01, pg02].map(pg =>
        expectEntityHavePermissionsTargetingId(
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
        expectEntityHavePermissionsTargetingId(
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
    const actions = Object.values(kPermissionsMap);
    const itemsUniq = actions.map(
      (action): PermissionItemInput => ({
        action,
        access: grantAccess,
        target: {targetId: workspace.resourceId},
        entityId: permissionGroup.resourceId,
      })
    );
    const itemsDuplicated = actions.concat(actions).map(
      (action): PermissionItemInput => ({
        action,
        access: grantAccess,
        target: {targetId: workspace.resourceId},
        entityId: permissionGroup.resourceId,
      })
    );
    const reqData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {items: itemsDuplicated, workspaceId: workspace.resourceId}
    );

    // First insert
    await addPermissionItems(context, reqData);

    // Second insert of the very same permission items as the first insert
    const result = await addPermissionItems(context, reqData);
    assertEndpointResultOk(result);

    const pgPermissionItems = await context.semantic.permissionItem.getManyByQuery(
      PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
    );
    expect(pgPermissionItems.length).toBe(itemsUniq.length);
  });
});
