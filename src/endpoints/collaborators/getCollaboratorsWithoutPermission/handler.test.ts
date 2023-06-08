import {identity} from 'lodash';
import {PermissionItemAppliesTo} from '../../../definitions/permissionItem';
import {AppActionType, AppResourceType, Resource} from '../../../definitions/system';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {extractResourceIdList, getResourceId} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {assignPgListToIdList, toAssignedPgListInput} from '../../permissionGroups/testUtils';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generateData/collaborator';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generateData/permissionGroup';
import {expectContainsNoneInForAnyType} from '../../testUtils/helpers/assertion';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getCollaboratorsWithoutPermission from './handler';
import {GetCollaboratorsWithoutPermissionEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getCollaboratorsWithoutPermission', () => {
  test('success', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const seedCount = 12;
    const seedUsers = await generateAndInsertCollaboratorListForTest(
      context,
      SYSTEM_SESSION_AGENT,
      workspace.resourceId,
      seedCount
    );
    const seedUserWithPermissionGroups = seedUsers.slice(0, 3);
    const seedUserWithPermissionItems = seedUsers.slice(3, 6);
    const seedUserWithoutPermissions = seedUsers.slice(6);

    // assign permissionn group to a subset of users
    const permissionGroups = await generateAndInsertPermissionGroupListForTest(context, 1, {
      workspaceId: workspace.resourceId,
    });
    const sessionAgent = makeUserSessionAgent(rawUser, userToken);
    await assignPgListToIdList(
      context,
      sessionAgent,
      workspace.resourceId,
      extractResourceIdList(seedUserWithPermissionGroups),
      toAssignedPgListInput(permissionGroups)
    );

    // add permission items to a subset of users
    await insertPermissionItemsForTest(context, userToken, workspace.resourceId, {
      entity: {entityId: extractResourceIdList(seedUserWithPermissionItems)},
      target: {targetType: AppResourceType.File, targetId: workspace.resourceId},
      grantAccess: true,
      action: AppActionType.Read,
      appliesTo: PermissionItemAppliesTo.ChildrenOfType,
    });

    // test
    let instData = RequestData.fromExpressRequest<GetCollaboratorsWithoutPermissionEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    let result = await getCollaboratorsWithoutPermission(context, instData);
    assertEndpointResultOk(result);
    expect(result.collaboratorIds).toHaveLength(seedUserWithoutPermissions.length);
    await assertCollaboratorsDoNotHavePermissions(
      context,
      result.collaboratorIds,
      seedUserWithPermissionGroups.concat(seedUserWithPermissionItems)
    );
  });
});

async function assertCollaboratorsDoNotHavePermissions(
  context: BaseContextType,
  collaboratorIdList: string[],
  notContainedInList?: Resource[]
) {
  let count = await context.semantic.assignedItem.countByQuery({
    assigneeId: {$in: collaboratorIdList},
    assignedItemType: AppResourceType.PermissionGroup,
  });
  expect(count).toBe(0);
  count = await context.semantic.permissionItem.countByQuery({
    entityId: {$in: collaboratorIdList},
  });
  expect(count).toBe(0);

  if (notContainedInList)
    expectContainsNoneInForAnyType(notContainedInList, collaboratorIdList, getResourceId, identity);
}
