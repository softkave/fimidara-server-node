import assert from 'assert';
import {first, identity} from 'lodash-es';
import {afterAll, beforeAll, describe, test} from 'vitest';
import {extractResourceIdList, getResourceId} from '../../../utils/fns.js';
import {makeUserSessionAgent} from '../../../utils/sessionUtils.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertAgentTokenListForTest} from '../../testHelpers/generate/agentToken.js';
import {generateAndInsertPermissionGroupListForTest} from '../../testHelpers/generate/permissionGroup.js';
import {expectContainsExactlyForAnyType} from '../../testHelpers/helpers/assertion.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {
  assignPgListToIdList,
  grantPermission,
  toAssignedPgListInput,
} from '../testUtils.js';
import getEntityAssignedPermissionGroups from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getEntityAssignedPermissionGroups', () => {
  test('implicit access and do not include inherited permission groups', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [pgList01, pgListAssignedToIn01, pgListAssignedToIn02, tokens] =
      await Promise.all([
        generateAndInsertPermissionGroupListForTest(2, {
          workspaceId: workspace.resourceId,
        }),
        generateAndInsertPermissionGroupListForTest(4, {
          workspaceId: workspace.resourceId,
        }),
        generateAndInsertPermissionGroupListForTest(6, {
          workspaceId: workspace.resourceId,
        }),
        generateAndInsertAgentTokenListForTest(1, {
          workspaceId: workspace.resourceId,
        }),
      ]);
    const userTokenSessionAgent = makeUserSessionAgent(rawUser, userToken);
    const pgList01Input = toAssignedPgListInput(pgList01);
    const pgListAssignedTo01Input = toAssignedPgListInput(pgListAssignedToIn01);
    const pgListAssignedTo02Input = toAssignedPgListInput(pgListAssignedToIn02);
    const pgList01IdList = extractResourceIdList(pgList01);
    const pgListAssignedTo01IdList =
      extractResourceIdList(pgListAssignedToIn01);
    const [agentToken01] = tokens;
    assert(agentToken01);
    const tokenIdList = extractResourceIdList([agentToken01]);
    const agentToken01Req = mockExpressRequestWithAgentToken(agentToken01);
    await Promise.all([
      assignPgListToIdList(
        userTokenSessionAgent,
        workspace.resourceId,
        pgList01IdList,
        pgListAssignedTo01Input
      ),
      assignPgListToIdList(
        userTokenSessionAgent,
        workspace.resourceId,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      assignPgListToIdList(
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
      RequestData.fromExpressRequest(agentToken01Req, {
        entityId: agentToken01.resourceId,
      })
    );
    assertEndpointResultOk(result01);
    expectContainsExactlyForAnyType(
      result01.permissionGroups,
      pgList01,
      getResourceId,
      getResourceId
    );
    expectContainsExactlyForAnyType(
      result01.immediateAssignedPermissionGroupsMeta,
      pgList01Input,
      item => item.permissionGroupId,
      identity
    );
  });

  test('include inherited permission groups', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02, tokens] =
      await Promise.all([
        generateAndInsertPermissionGroupListForTest(2, {
          workspaceId: workspace.resourceId,
        }),
        generateAndInsertPermissionGroupListForTest(4, {
          workspaceId: workspace.resourceId,
        }),
        generateAndInsertPermissionGroupListForTest(6, {
          workspaceId: workspace.resourceId,
        }),
        generateAndInsertAgentTokenListForTest(1, {
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
        agent,
        workspace.resourceId,
        pgList01IdList,
        pgListAssignedTo01Input
      ),
      assignPgListToIdList(
        agent,
        workspace.resourceId,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      assignPgListToIdList(
        agent,
        workspace.resourceId,
        tokenIdList,
        pgList01Input
      ),
    ]);

    // Test fetching including inherited permission groups
    const result02 = await getEntityAssignedPermissionGroups(
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
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [pgList01, pgListAssignedTo01, pgListAssignedTo02, tokens] =
      await Promise.all([
        generateAndInsertPermissionGroupListForTest(2, {
          workspaceId: workspace.resourceId,
        }),
        generateAndInsertPermissionGroupListForTest(4, {
          workspaceId: workspace.resourceId,
        }),
        generateAndInsertPermissionGroupListForTest(6, {
          workspaceId: workspace.resourceId,
        }),
        generateAndInsertAgentTokenListForTest(1, {
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
        agent,
        workspace.resourceId,
        pgList01IdList,
        pgListAssignedTo01Input
      ),
      assignPgListToIdList(
        agent,
        workspace.resourceId,
        pgListAssignedTo01IdList,
        pgListAssignedTo02Input
      ),
      grantPermission(
        userReq,
        workspace.resourceId,
        agentToken02.resourceId,
        pgList01IdList,
        'updatePermission'
      ),
    ]);

    // Fetch with an agent assigned read permission
    const result03 = await getEntityAssignedPermissionGroups(
      RequestData.fromExpressRequest(agentToken02Req, {
        entityId: first(pgList01)!.resourceId,
      })
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
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const [pgList01, tokens] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(2, {
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertAgentTokenListForTest(1, {
        workspaceId: workspace.resourceId,
      }),
    ]);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const [agentToken02] = tokens;
    assert(agentToken02);
    const agentToken02Req = mockExpressRequestWithAgentToken(agentToken02);
    await Promise.all([
      assignPgListToIdList(
        agent,
        workspace.resourceId,
        [agentToken02.resourceId],
        toAssignedPgListInput(pgList01)
      ),
    ]);

    const result03 = await getEntityAssignedPermissionGroups(
      RequestData.fromExpressRequest(agentToken02Req, {
        entityId: agentToken02.resourceId,
      })
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
