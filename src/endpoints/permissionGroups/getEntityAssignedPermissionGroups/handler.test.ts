import assert from 'assert';
import {first} from 'lodash';
import {extractResourceIdList, getResourceId} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../contexts/SessionContext';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
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
import {
  assignPgListToIdList,
  grantReadPermission,
  includesPermissionGroupById,
  makeKeyFromAssignedPermissionGroupMetaOrInput,
  toAssignedPgListInput,
} from '../testUtils';
import getEntityAssignedPermissionGroups from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getEntityAssignedPermissionGroups', () => {
  test('implicit access and do not include inherited permission groups', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [pgList01, pgListAssignedToIn01, pgListAssignedToIn02, tokens] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 4, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 6, {workspaceId: workspace.resourceId}),
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
        context,
        userTokenSessionAgent,
        workspace,
        pgList01IdList,
        pgListAssignedTo01Input
      ),
      assignPgListToIdList(
        context,
        userTokenSessionAgent,
        workspace,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      assignPgListToIdList(context, userTokenSessionAgent, workspace, tokenIdList, pgList01Input),
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

  test('include inherited permission groups', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02, tokens] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 4, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 6, {workspaceId: workspace.resourceId}),
      generateAndInsertProgramAccessTokenListForTest(context, 1, {
        workspaceId: workspace.resourceId,
      }),
    ]);
    const agent = makeUserSessionAgent(userToken, rawUser);
    const pgList01Input = toAssignedPgListInput(pgList01);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedTo01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedTo02);
    const pgList01IdList = extractResourceIdList(pgList01);
    const pgListAssignedTo01IdList = extractResourceIdList(pgListAssignedTo01);
    const [programToken01] = tokens;
    assert(programToken01);
    const tokenIdList = extractResourceIdList([programToken01]);
    const programToken01Req = mockExpressRequestWithProgramToken(programToken01);
    await Promise.all([
      assignPgListToIdList(context, agent, workspace, pgList01IdList, pgListAssignedTo01Input),
      assignPgListToIdList(
        context,
        agent,
        workspace,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      assignPgListToIdList(context, agent, workspace, tokenIdList, pgList01Input),
    ]);

    // Test fetching including inherited permission groups
    const result02 = await getEntityAssignedPermissionGroups(
      context,
      RequestData.fromExpressRequest(programToken01Req, {
        entityId: programToken01.resourceId,
        includeInheritedPermissionGroups: true,
      })
    );
    expectContainsExactly(
      result02.permissionGroups,
      pgList01.concat(pgListAssignedTo01, pgListAssignedTo02),
      getResourceId
    );
    result02.permissionGroups.forEach(pg => {
      if (includesPermissionGroupById(pgList01, pg.resourceId)) {
        expectContainsExactly(
          pg.assignedPermissionGroupsMeta,
          pgListAssignedTo01Input,
          makeKeyFromAssignedPermissionGroupMetaOrInput
        );
      }
      if (includesPermissionGroupById(pgListAssignedTo01, pg.resourceId)) {
        expectContainsExactly(
          pg.assignedPermissionGroupsMeta,
          pgListAssignedTo02Input,
          makeKeyFromAssignedPermissionGroupMetaOrInput
        );
      }
      if (includesPermissionGroupById(pgListAssignedTo02, pg.resourceId)) {
        expect(pg.assignedPermissionGroupsMeta).toHaveLength(0);
      }
    });
  });

  test('with read permission', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02, tokens] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 4, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 6, {workspaceId: workspace.resourceId}),
      generateAndInsertProgramAccessTokenListForTest(context, 1, {
        workspaceId: workspace.resourceId,
      }),
    ]);
    const agent = makeUserSessionAgent(userToken, rawUser);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedTo01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedTo02);
    const pgList01IdList = extractResourceIdList(pgList01);
    const pgListAssignedTo01IdList = extractResourceIdList(pgListAssignedTo01);
    const [programToken02] = tokens;
    assert(programToken02);
    const programToken02Req = mockExpressRequestWithProgramToken(programToken02);
    await Promise.all([
      assignPgListToIdList(context, agent, workspace, pgList01IdList, pgListAssignedTo01Input),
      assignPgListToIdList(
        context,
        agent,
        workspace,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      grantReadPermission(
        context,
        programToken02Req,
        workspace,
        programToken02.resourceId,
        pgList01IdList
      ),
    ]);

    // Fetch with an agent assigned read permission
    const result03 = await getEntityAssignedPermissionGroups(
      context,
      RequestData.fromExpressRequest(programToken02Req, {entityId: first(pgList01)!.resourceId})
    );
    assertEndpointResultOk(result03);
    expectContainsExactly(result03.permissionGroups, pgListAssignedTo01, getResourceId);
  });
});
