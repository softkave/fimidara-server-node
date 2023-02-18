import {assert} from 'joi';
import {extractResourceIdList, getResourceId} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../test-utils/generate-data/collaborator';
import {generateAndInsertPermissionGroupListForTest} from '../../test-utils/generate-data/permissionGroup';
import {generateAndInsertProgramAccessTokenListForTest} from '../../test-utils/generate-data/programAccessToken';
import {expectContainsExactly} from '../../test-utils/helpers/assertion';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithProgramToken,
} from '../../test-utils/test-utils';
import getEntityAssignedPermissionGroups from '../getEntityAssignedPermissionGroups/handler';
import {
  assignPgListToIdList,
  makeKeyFromAssignedPermissionGroupMetaOrInput,
  toAssignedPgListInput,
} from '../testUtils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('assignPermissionGroups', () => {
  test('assign permission groups to users', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const agent = makeUserSessionAgent(userToken, rawUser);
    const [pgList01] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertCollaboratorListForTest(context, agent, workspace.resourceId, 2),
    ]);
    const pgList01Input = toAssignedPgListInput(pgList01);
    const pgList01IdList = extractResourceIdList(pgList01);
    await Promise.all([
      assignPgListToIdList(
        userTokenSessionAgent,
        workspace,
        pgList01IdList,
        pgListAssignedTo01Input
      ),
    ]);

    // Test fetching without including inherited permission groups. This test
    // also tests the implicit access granted the calling agent because it is
    // fetching it's own permisison groups.
    const result01 = await getEntityAssignedPermissionGroups(
      context,
      RequestData.fromExpressRequest(programToken01Req, {entityId: programToken01.resourceId})
    );
    assertEndpointResultOk(result01);
    expectContainsExactly(result01.permissionGroups, pgList01, getResourceId);
    expectContainsExactly(
      result01.immediateAssignedPermissionGroupsMeta,
      pgList01Input,
      makeKeyFromAssignedPermissionGroupMetaOrInput
    );
    result01.permissionGroups.forEach(pg => {
      expectContainsExactly(
        pg.assignedPermissionGroupsMeta,
        pgListAssignedTo01Input,
        makeKeyFromAssignedPermissionGroupMetaOrInput
      );
    });
  });

  test('assign permission groups to users', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [pgList01, pgListAssignedToIn01, pgListAssignedToIn02, tokens] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertProgramAccessTokenListForTest(context, 1, {
        workspaceId: workspace.resourceId,
      }),
    ]);
    const userTokenSessionAgent = makeUserSessionAgent(userToken, rawUser);
    const pgList01Input = toAssignedPgListInput(pgList01);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedToIn01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedToIn02);
    const pgList01IdList = extractResourceIdList(pgList01);
    const pgListAssignedTo01IdList = extractResourceIdList(pgListAssignedToIn01);
    const [programToken01] = tokens;
    assert(programToken01);
    const tokenIdList = extractResourceIdList([programToken01]);
    const programToken01Req = mockExpressRequestWithProgramToken(programToken01);
    await Promise.all([
      assignPgListToIdList(
        userTokenSessionAgent,
        workspace,
        pgList01IdList,
        pgListAssignedTo01Input
      ),
      assignPgListToIdList(
        userTokenSessionAgent,
        workspace,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      assignPgListToIdList(userTokenSessionAgent, workspace, tokenIdList, pgList01Input),
    ]);

    // Test fetching without including inherited permission groups. This test
    // also tests the implicit access granted the calling agent because it is
    // fetching it's own permisison groups.
    const result01 = await getEntityAssignedPermissionGroups(
      context,
      RequestData.fromExpressRequest(programToken01Req, {entityId: programToken01.resourceId})
    );
    assertEndpointResultOk(result01);
    expectContainsExactly(result01.permissionGroups, pgList01, getResourceId);
    expectContainsExactly(
      result01.immediateAssignedPermissionGroupsMeta,
      pgList01Input,
      makeKeyFromAssignedPermissionGroupMetaOrInput
    );
    result01.permissionGroups.forEach(pg => {
      expectContainsExactly(
        pg.assignedPermissionGroupsMeta,
        pgListAssignedTo01Input,
        makeKeyFromAssignedPermissionGroupMetaOrInput
      );
    });
  });
});
