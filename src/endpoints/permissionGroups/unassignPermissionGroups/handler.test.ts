import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {extractResourceIdList} from '../../../utils/fns.js';
import {makeUserSessionAgent} from '../../../utils/sessionUtils.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertCollaboratorListForTest} from '../../testHelpers/generate/collaborator.js';
import {generateAndInsertPermissionGroupListForTest} from '../../testHelpers/generate/permissionGroup.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {fetchEntityAssignedPermissionGroupList} from '../getEntityAssignedPermissionGroups/utils.js';
import {assignPgListToIdList, toAssignedPgListInput} from '../testUtils.js';
import unassignPermissionGroups from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('unassignPermissionGroups', () => {
  test('permission groups unassigned', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const [pgList01, cList01] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(2, {
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertCollaboratorListForTest(agent, workspace.resourceId, 2),
    ]);
    const cList01Ids = extractResourceIdList(cList01);
    const pgList01Ids = extractResourceIdList(pgList01);
    await assignPgListToIdList(
      agent,
      workspace.resourceId,
      cList01Ids,
      toAssignedPgListInput(pgList01)
    );

    const result01 = await unassignPermissionGroups(
      RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          permissionGroupId: pgList01Ids,
          entityId: cList01Ids,
        }
      )
    );
    assertEndpointResultOk(result01);

    const entityPgListResult = await Promise.all(
      cList01.map(collaborator =>
        fetchEntityAssignedPermissionGroupList({
          workspaceId: workspace.resourceId,
          entityId: collaborator.resourceId,
          includeInheritedPermissionGroups: false,
        })
      )
    );
    const entityPgListId: string[] = [];
    entityPgListResult.forEach(next => {
      next.permissionGroups.forEach(pg => entityPgListId.push(pg.resourceId));
    });
    expect(entityPgListId).not.toEqual(expect.arrayContaining(pgList01Ids));
  });
});
