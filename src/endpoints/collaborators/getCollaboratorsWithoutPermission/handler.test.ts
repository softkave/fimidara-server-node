import {identity} from 'lodash';
import {kFimidaraResourceType, Resource} from '../../../definitions/system';
import {kSystemSessionAgent} from '../../../utils/agent';
import {extractResourceIdList, getResourceId} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {
  assignPgListToIdList,
  toAssignedPgListInput,
} from '../../permissionGroups/testUtils';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generate/collaborator';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generate/permissionGroup';
import {expectContainsNoneInForAnyType} from '../../testUtils/helpers/assertion';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionItemsForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getCollaboratorsWithoutPermission from './handler';
import {GetCollaboratorsWithoutPermissionEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getCollaboratorsWithoutPermission', () => {
  test('success', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const seedCount = 12;
    const seedUsers = await generateAndInsertCollaboratorListForTest(
      kSystemSessionAgent,
      workspace.resourceId,
      seedCount
    );
    const seedUserWithPermissionGroups = seedUsers.slice(0, 3);
    const seedUserWithPermissionItems = seedUsers.slice(3, 6);
    const seedUserWithoutPermissions = seedUsers.slice(6);

    // assign permissionn group to a subset of users
    const permissionGroups = await generateAndInsertPermissionGroupListForTest(1, {
      workspaceId: workspace.resourceId,
    });
    const sessionAgent = makeUserSessionAgent(rawUser, userToken);
    await assignPgListToIdList(
      sessionAgent,
      workspace.resourceId,
      extractResourceIdList(seedUserWithPermissionGroups),
      toAssignedPgListInput(permissionGroups)
    );

    // add permission items to a subset of users
    await insertPermissionItemsForTest(userToken, workspace.resourceId, {
      entityId: extractResourceIdList(seedUserWithPermissionItems),
      target: {targetId: workspace.resourceId},
      access: true,
      action: 'readFile',
    });

    // test
    const instData =
      RequestData.fromExpressRequest<GetCollaboratorsWithoutPermissionEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await getCollaboratorsWithoutPermission(instData);
    assertEndpointResultOk(result);
    expect(result.collaboratorIds).toHaveLength(seedUserWithoutPermissions.length);
    await assertCollaboratorsDoNotHavePermissions(
      result.collaboratorIds,
      seedUserWithPermissionGroups.concat(seedUserWithPermissionItems)
    );
  });
});

async function assertCollaboratorsDoNotHavePermissions(
  collaboratorIdList: string[],
  notContainedInList?: Resource[]
) {
  let count = await kSemanticModels.assignedItem().countByQuery({
    assigneeId: {$in: collaboratorIdList},
    assignedItemType: kFimidaraResourceType.PermissionGroup,
  });
  expect(count).toBe(0);
  count = await kSemanticModels.permissionItem().countByQuery({
    entityId: {$in: collaboratorIdList},
  });
  expect(count).toBe(0);

  if (notContainedInList)
    expectContainsNoneInForAnyType(
      notContainedInList,
      collaboratorIdList,
      getResourceId,
      identity
    );
}
