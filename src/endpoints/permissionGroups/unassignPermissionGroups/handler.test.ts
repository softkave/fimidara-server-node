import {extractResourceIdList} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generateData/collaborator';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generateData/permissionGroup';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {fetchEntityAssignedPermissionGroupList} from '../getEntityAssignedPermissionGroups/utils';
import {assignPgListToIdList, toAssignedPgListInput} from '../testUtils';
import unassignPermissionGroups from './handler';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('unassignPermissionGroups', () => {
  test('permission groups unassigned', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const [pgList01, cList01] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertCollaboratorListForTest(context, agent, workspace.resourceId, 2),
    ]);
    const cList01Ids = extractResourceIdList(cList01);
    const pgList01Ids = extractResourceIdList(pgList01);
    await assignPgListToIdList(
      context,
      agent,
      workspace.resourceId,
      cList01Ids,
      toAssignedPgListInput(pgList01)
    );

    const result01 = await unassignPermissionGroups(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
        workspaceId: workspace.resourceId,
        permissionGroups: pgList01Ids,
        entityId: cList01Ids,
      })
    );
    assertEndpointResultOk(result01);

    const entityPgListResult = await Promise.all(
      cList01.map(collaborator =>
        fetchEntityAssignedPermissionGroupList(context!, collaborator.resourceId, false)
      )
    );
    const entityPgListId: string[] = [];
    entityPgListResult.forEach(next => {
      next.permissionGroups.forEach(pg => entityPgListId.push(pg.resourceId));
    });
    expect(entityPgListId).not.toEqual(expect.arrayContaining(pgList01Ids));
  });
});
