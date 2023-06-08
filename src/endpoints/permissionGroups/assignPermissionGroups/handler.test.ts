import assert from 'assert';
import {first} from 'lodash';
import {extractResourceIdList, getResourceId} from '../../../utils/fns';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {BaseContextType} from '../../contexts/types';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generateData/collaborator';
import {generateAndInsertPermissionGroupListForTest} from '../../testUtils/generateData/permissionGroup';
import {expectContainsExactlyForAnyType} from '../../testUtils/helpers/assertion';
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
import {makeKeyFromAssignedPermissionGroupMetaOrInput, toAssignedPgListInput} from '../testUtils';
import assignPermissionGroups from './handler';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('assignPermissionGroups', () => {
  test('assign permission groups to users', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const [pgList01, collaboratorList] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertCollaboratorListForTest(context, agent, workspace.resourceId, 2),
    ]);
    const pgList01Input = toAssignedPgListInput(pgList01);

    const result01 = await assignPermissionGroups(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
        workspaceId: workspace.resourceId,
        permissionGroups: pgList01Input,
        entityId: extractResourceIdList(collaboratorList),
      })
    );
    assertEndpointResultOk(result01);

    const permissionGroupsResult = await Promise.all(
      collaboratorList.map(collaborator =>
        fetchEntityAssignedPermissionGroupList(context!, collaborator.resourceId, false)
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
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const [pgList01, collaboratorList] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(context, 2, {workspaceId: workspace.resourceId}),
      generateAndInsertCollaboratorListForTest(context, agent, workspace.resourceId, 1),
    ]);
    const pgList01Input = toAssignedPgListInput(pgList01);
    const collaborator = first(collaboratorList);
    assert(collaborator);

    const result01 = await assignPermissionGroups(
      context,
      RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
        workspaceId: workspace.resourceId,
        permissionGroups: pgList01Input,
        entityId: collaborator.resourceId,
      })
    );
    assertEndpointResultOk(result01);

    const permissionGroupsResult = await fetchEntityAssignedPermissionGroupList(
      context!,
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
