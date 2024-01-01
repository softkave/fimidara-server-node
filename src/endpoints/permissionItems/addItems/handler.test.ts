import {faker} from '@faker-js/faker';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import RequestData from '../../RequestData';
import {checkAuthorization} from '../../contexts/authorizationChecks/checkAuthorizaton';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {generateAndInsertTestFolders} from '../../testUtils/generate/folder';
import {expectEntityHasPermissionsTargetingId} from '../../testUtils/helpers/permissionItem';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import PermissionItemQueries from '../queries';
import {PermissionItemInput} from '../types';
import addPermissionItems from './handler';
import {AddPermissionItemsEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('addItems', () => {
  test('permission items added', async () => {
    // TODO: add more tests for target and appliesTo

    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [
      {permissionGroup: pg01},
      {permissionGroup: pg02},
      {permissionGroup: pg03},
      {permissionGroup: pg04},
    ] = await Promise.all([
      insertPermissionGroupForTest(userToken, workspace.resourceId),
      insertPermissionGroupForTest(userToken, workspace.resourceId),
      insertPermissionGroupForTest(userToken, workspace.resourceId),
      insertPermissionGroupForTest(userToken, workspace.resourceId),
    ]);

    const grantAccess = faker.datatype.boolean();
    const actionsWithoutWildcard = Object.values(kPermissionsMap).filter(
      action => action !== kPermissionsMap.wildcard
    );
    const subsetWorkspaceActions = faker.helpers.arrayElements(actionsWithoutWildcard);
    const completeWorkspaceActionsInputItems = actionsWithoutWildcard.map(
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
    const result = await addPermissionItems(reqData);
    assertEndpointResultOk(result);
    await Promise.all(
      [pg01, pg02].map(pg =>
        expectEntityHasPermissionsTargetingId(
          pg.resourceId,
          actionsWithoutWildcard,
          workspace.resourceId,
          /** expected result */ grantAccess
        )
      )
    );
    await Promise.all(
      [pg03, pg04].map(pg =>
        expectEntityHasPermissionsTargetingId(
          pg.resourceId,
          subsetWorkspaceActions,
          workspace.resourceId,
          /** expected result */ grantAccess
        )
      )
    );

    await checkAuthorization({
      workspace,
      workspaceId: workspace.resourceId,
      target: {
        entityId: faker.helpers.arrayElement([
          pg01.resourceId,
          pg02.resourceId,
          pg03.resourceId,
          pg04.resourceId,
        ]),
        action: faker.helpers.arrayElement(actionsWithoutWildcard),
        targetId: workspace.resourceId,
      },
    });
  });

  test('permission items are not duplicated', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
      userToken,
      workspace.resourceId
    );
    const grantAccess = faker.datatype.boolean();
    const actions = Object.values(kPermissionsMap);
    const actionsWithoutWildcard = actions.filter(action => action !== 'wildcard');
    const itemsUniq = actionsWithoutWildcard.map(
      (action): PermissionItemInput => ({
        action,
        access: grantAccess,
        target: {targetId: workspace.resourceId},
        entityId: permissionGroup.resourceId,
      })
    );
    const itemsDuplicated = actionsWithoutWildcard.concat(actionsWithoutWildcard).map(
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
    await addPermissionItems(reqData);

    // Second insert of the very same permission items as the first insert
    const result = await addPermissionItems(reqData);
    assertEndpointResultOk(result);

    const pgPermissionItems = await kSemanticModels
      .permissionItem()
      .getManyByQuery(
        PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
      );
    expect(pgPermissionItems.length).toBe(itemsUniq.length);
  });

  test('permission items folded into wildcard', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {permissionGroup: permissionGroup} = await insertPermissionGroupForTest(
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
    const reqData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {items: itemsUniq, workspaceId: workspace.resourceId}
    );

    let result = await addPermissionItems(reqData);
    assertEndpointResultOk(result);

    let pgPermissionItems = await kSemanticModels
      .permissionItem()
      .getManyByQuery(
        PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
      );
    expect(pgPermissionItems.length).toBe(1);

    // Trying again
    result = await addPermissionItems(reqData);
    assertEndpointResultOk(result);

    pgPermissionItems = await kSemanticModels
      .permissionItem()
      .getManyByQuery(
        PermissionItemQueries.getByPermissionEntity(permissionGroup.resourceId)
      );
    expect(pgPermissionItems.length).toBe(1);
  });

  test('correct targetParentId added', async () => {
    const {userToken, user} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [folder01] = await generateAndInsertTestFolders(1, {
      workspaceId: workspace.resourceId,
      parentId: null,
    });
    const [folder02] = await generateAndInsertTestFolders(1, {
      workspaceId: workspace.resourceId,
      parentId: folder01.resourceId,
    });
    const itemsInput: PermissionItemInput[] = [
      {
        access: true,
        action: 'readFile',
        entityId: user.resourceId,
        target: {targetId: folder01.resourceId},
      },
      {
        access: true,
        action: 'readFile',
        entityId: user.resourceId,
        target: {targetId: folder02.resourceId},
      },
    ];
    const reqData = RequestData.fromExpressRequest<AddPermissionItemsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {items: itemsInput, workspaceId: workspace.resourceId}
    );

    const result = await addPermissionItems(reqData);
    assertEndpointResultOk(result);

    const pItems = await kSemanticModels
      .permissionItem()
      .getManyByQuery(PermissionItemQueries.getByPermissionEntity(user.resourceId));
    const pItemFolder01 = pItems.find(item => item.targetId === folder01.resourceId);
    const pItemFolder02 = pItems.find(item => item.targetId === folder02.resourceId);
    expect(pItemFolder01).toBeTruthy();
    expect(pItemFolder02).toBeTruthy();
    expect(pItemFolder01?.targetParentId).toBe(workspace.resourceId);
    expect(pItemFolder02?.targetParentId).toBe(folder01.resourceId);
  });
});
