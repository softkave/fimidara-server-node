import assert from 'assert';
import {first} from 'lodash-es';
import {sortStringListLexicographically} from 'softkave-js-utils';
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
import {toAssignedPgListInput} from '../testUtils.js';
import assignPermissionGroups from './handler.js';

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
      generateAndInsertPermissionGroupListForTest(2, {
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertCollaboratorListForTest(agent, workspace.resourceId, 2),
    ]);
    const pgList01Input = toAssignedPgListInput(pgList01);

    const result01 = await assignPermissionGroups(
      RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          permissionGroupId: pgList01Input,
          entityId: extractResourceIdList(collaboratorList),
        }
      )
    );
    assertEndpointResultOk(result01);

    const permissionGroupsResult = await Promise.all(
      collaboratorList.map(collaborator =>
        fetchEntityAssignedPermissionGroupList({
          workspaceId: workspace.resourceId,
          entityId: collaborator.resourceId,
          includeInheritedPermissionGroups: false,
        })
      )
    );
    permissionGroupsResult.forEach(next => {
      expect(
        sortStringListLexicographically(
          extractResourceIdList(next.permissionGroups)
        )
      ).toEqual(sortStringListLexicographically(pgList01Input));
    });
  });

  test('assign permission groups to single user', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const agent = makeUserSessionAgent(rawUser, userToken);
    const [pgList01, collaboratorList] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(2, {
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertCollaboratorListForTest(agent, workspace.resourceId, 1),
    ]);
    const pgList01Input = toAssignedPgListInput(pgList01);
    const collaborator = first(collaboratorList);
    assert(collaborator);

    const result01 = await assignPermissionGroups(
      RequestData.fromExpressRequest(
        mockExpressRequestWithAgentToken(userToken),
        {
          workspaceId: workspace.resourceId,
          permissionGroupId: pgList01Input,
          entityId: collaborator.resourceId,
        }
      )
    );
    assertEndpointResultOk(result01);

    const permissionGroupsResult = await fetchEntityAssignedPermissionGroupList(
      {
        workspaceId: workspace.resourceId,
        entityId: collaborator.resourceId,
        includeInheritedPermissionGroups: false,
      }
    );
    expect(
      sortStringListLexicographically(
        extractResourceIdList(permissionGroupsResult.permissionGroups)
      )
    ).toEqual(sortStringListLexicographically(pgList01Input));
  });
});
