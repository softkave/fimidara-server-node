import assert from 'assert';
import {first} from 'lodash';
import {extractResourceIdList, getResourceId} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generate/collaborator';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generate/permissionGroup';
import {expectContainsExactlyForAnyType} from '../../testUtils/helpers/assertion';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {fetchEntityAssignedPermissionGroupList} from '../getEntityAssignedPermissionGroups/utils';
import {
  makeKeyFromAssignedPermissionGroupMetaOrInput,
  toAssignedPgListInput,
} from '../testUtils';
import assignPermissionGroups from './handler';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('assignPermissionGroups', () => {
  test('assign permission groups to users', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const [pgList01, collaboratorList] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(2, {workspaceId: workspace.resourceId}),
      generateAndInsertCollaboratorListForTest(agent, workspace.resourceId, 2),
    ]);
    const pgList01Input = toAssignedPgListInput(pgList01);

    const result01 = await assignPermissionGroups(
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
        workspaceId: workspace.resourceId,
        permissionGroups: pgList01Input,
        entityId: extractResourceIdList(collaboratorList),
      })
    );
    assertEndpointResultOk(result01);

    const permissionGroupsResult = await Promise.all(
      collaboratorList.map(collaborator =>
        fetchEntityAssignedPermissionGroupList(collaborator.resourceId, false)
      )
    );
    permissionGroupsResult.forEach(next => {
      expectContainsExactlyForAnyType(
        next.permissionGroups,
        pgList01Input,
        getResourceId,
        makeKeyFromAssignedPermissionGroupMetaOrInput
      );
    });
  });

  test('assign permission groups to single user', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const [pgList01, collaboratorList] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(2, {workspaceId: workspace.resourceId}),
      generateAndInsertCollaboratorListForTest(agent, workspace.resourceId, 1),
    ]);
    const pgList01Input = toAssignedPgListInput(pgList01);
    const collaborator = first(collaboratorList);
    assert(collaborator);

    const result01 = await assignPermissionGroups(
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
        workspaceId: workspace.resourceId,
        permissionGroups: pgList01Input,
        entityId: collaborator.resourceId,
      })
    );
    assertEndpointResultOk(result01);

    const permissionGroupsResult = await fetchEntityAssignedPermissionGroupList(
      collaborator.resourceId,
      false
    );
    expectContainsExactlyForAnyType(
      permissionGroupsResult.permissionGroups,
      pgList01Input,
      getResourceId,
      makeKeyFromAssignedPermissionGroupMetaOrInput
    );
  });
});
