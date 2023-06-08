import assert from 'assert';
import {first} from 'lodash';
import {extractResourceIdList, getResourceId} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generateData/agentToken';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generateData/permissionGroup';
import {
  expectContainsExactly,
  expectContainsExactlyForAnyType,
} from '../../testUtils/helpers/assertion';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {
  assignPgListToIdList,
  grantReadPermission,
  makeKeyFromAssignedPermissionGroupMetaOrInput,
  toAssignedPgListInput,
} from '../testUtils';
import getEntityAssignedPermissionGroups from './handler';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
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
      generateAndInsertAgentTokenListForTest(context, 1, {
        workspaceId: workspace.resourceId,
      }),
    ]);
    const userTokenSessionAgent = makeUserSessionAgent(rawUser, userToken);
    const pgList01Input = toAssignedPgListInput(pgList01);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedToIn01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedToIn02);
    const pgList01IdList = extractResourceIdList(pgList01);
    const pgListAssignedTo01IdList = extractResourceIdList(pgListAssignedToIn01);
    const [agentToken01] = tokens;
    assert(agentToken01);
    const tokenIdList = extractResourceIdList([agentToken01]);
    const agentToken01Req = mockExpressRequestWithAgentToken(agentToken01);
    await Promise.all([
      assignPgListToIdList(
        context,
        userTokenSessionAgent,
        workspace.resourceId,
        pgList01IdList,
        pgListAssignedTo01Input
      ),
      assignPgListToIdList(
        context,
        userTokenSessionAgent,
        workspace.resourceId,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      assignPgListToIdList(
        context,
        userTokenSessionAgent,
        workspace.resourceId,
        tokenIdList,
        pgList01Input
      ),
    ]);

    // Test fetching without including inherited permission groups. This test
    // also tests the implicit access granted the calling agent because it is
    // fetching it's own permisison groups.
    const result01 = await getEntityAssignedPermissionGroups(
      context,
      RequestData.fromExpressRequest(agentToken01Req, {entityId: agentToken01.resourceId})
    );
    assertEndpointResultOk(result01);
    expectContainsExactlyForAnyType(
      result01.permissionGroups,
      pgList01,
      getResourceId,
      getResourceId
    );
    expectContainsExactly(
      result01.immediateAssignedPermissionGroupsMeta,
      pgList01Input,
      makeKeyFromAssignedPermissionGroupMetaOrInput
    );
  });

  test('include inherited permission groups', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02, tokens] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 4, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 6, {workspaceId: workspace.resourceId}),
      generateAndInsertAgentTokenListForTest(context, 1, {
        workspaceId: workspace.resourceId,
      }),
    ]);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const pgList01Input = toAssignedPgListInput(pgList01);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedTo01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedTo02);
    const pgList01IdList = extractResourceIdList(pgList01);
    const pgListAssignedTo01IdList = extractResourceIdList(pgListAssignedTo01);
    const [agentToken01] = tokens;
    assert(agentToken01);
    const tokenIdList = extractResourceIdList([agentToken01]);
    const agentToken01Req = mockExpressRequestWithAgentToken(agentToken01);
    await Promise.all([
      assignPgListToIdList(
        context,
        agent,
        workspace.resourceId,
        pgList01IdList,
        pgListAssignedTo01Input
      ),
      assignPgListToIdList(
        context,
        agent,
        workspace.resourceId,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      assignPgListToIdList(context, agent, workspace.resourceId, tokenIdList, pgList01Input),
    ]);

    // Test fetching including inherited permission groups
    const result02 = await getEntityAssignedPermissionGroups(
      context,
      RequestData.fromExpressRequest(agentToken01Req, {
        entityId: agentToken01.resourceId,
        includeInheritedPermissionGroups: true,
      })
    );
    expectContainsExactlyForAnyType(
      result02.permissionGroups,
      pgList01.concat(pgListAssignedTo01, pgListAssignedTo02),
      getResourceId,
      getResourceId
    );
  });

  test('with read permission', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02, tokens] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 4, {workspaceId: workspace.resourceId}),
      generateAndInsertPermissionGroupListForTest(context, 6, {workspaceId: workspace.resourceId}),
      generateAndInsertAgentTokenListForTest(context, 1, {
        workspaceId: workspace.resourceId,
      }),
    ]);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedTo01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedTo02);
    const pgList01IdList = extractResourceIdList(pgList01);
    const pgListAssignedTo01IdList = extractResourceIdList(pgListAssignedTo01);
    const [agentToken02] = tokens;
    assert(agentToken02);
    const userReq = mockExpressRequestWithAgentToken(userToken);
    const agentToken02Req = mockExpressRequestWithAgentToken(agentToken02);
    await Promise.all([
      assignPgListToIdList(
        context,
        agent,
        workspace.resourceId,
        pgList01IdList,
        pgListAssignedTo01Input
      ),
      assignPgListToIdList(
        context,
        agent,
        workspace.resourceId,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      grantReadPermission(
        context,
        userReq,
        workspace.resourceId,
        agentToken02.resourceId,
        pgList01IdList
      ),
    ]);

    // Fetch with an agent assigned read permission
    const result03 = await getEntityAssignedPermissionGroups(
      context,
      RequestData.fromExpressRequest(agentToken02Req, {entityId: first(pgList01)!.resourceId})
    );
    assertEndpointResultOk(result03);
    expectContainsExactlyForAnyType(
      result03.permissionGroups,
      pgListAssignedTo01,
      getResourceId,
      getResourceId
    );
  });

  test('reading own permission groups', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const [pgList01, tokens] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertAgentTokenListForTest(context, 1, {
        workspaceId: workspace.resourceId,
      }),
    ]);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const [agentToken02] = tokens;
    assert(agentToken02);
    const agentToken02Req = mockExpressRequestWithAgentToken(agentToken02);
    await Promise.all([
      assignPgListToIdList(
        context,
        agent,
        workspace.resourceId,
        [agentToken02.resourceId],
        toAssignedPgListInput(pgList01)
      ),
    ]);

    const result03 = await getEntityAssignedPermissionGroups(
      context,
      RequestData.fromExpressRequest(agentToken02Req, {entityId: agentToken02.resourceId})
    );
    assertEndpointResultOk(result03);
    expectContainsExactlyForAnyType(
      result03.permissionGroups,
      pgList01,
      getResourceId,
      getResourceId
    );
  });
});
