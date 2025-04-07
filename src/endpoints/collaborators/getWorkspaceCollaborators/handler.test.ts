import {
  calculatePageSize,
  indexArray,
  sortStringListLexicographically,
} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import RequestData from '../../RequestData.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import AssignedItemQueries from '../../assignedItems/queries.js';
import {generateAndInsertCollaboratorListForTest} from '../../testHelpers/generate/collaborator.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import {collaboratorExtractor} from '../utils.js';
import getWorkspaceCollaborators from './handler.js';
import {GetWorkspaceCollaboratorsEndpointParams} from './types.js';

/**
 * TODO:
 * - Check that only permitted collaborators are returned
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getWorkspaceCollaborators', () => {
  test('workspace collaborators returned', async () => {
    const {userToken, user} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);

    const reqData =
      RequestData.fromExpressRequest<GetWorkspaceCollaboratorsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await getWorkspaceCollaborators(reqData);

    assertEndpointResultOk(result);
    const updatedUser = await populateUserWorkspaces(
      await kIjxSemantic
        .user()
        .assertGetOneByQuery({resourceId: user.resourceId})
    );
    expect(result.collaborators).toContainEqual(
      collaboratorExtractor(updatedUser, workspace.resourceId)
    );
  });

  test('pagination', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const seedCount = 15;
    const seedUsers = await generateAndInsertCollaboratorListForTest(
      kSystemSessionAgent,
      workspace.resourceId,
      seedCount
    );
    seedUsers.push(rawUser);
    const count = await kIjxSemantic
      .assignedItem()
      .countByQuery(
        AssignedItemQueries.getByAssignedItem(
          workspace.resourceId,
          workspace.resourceId
        )
      );
    expect(count).toBeGreaterThanOrEqual(seedCount);

    const pageSize = 10;
    let page = 0;
    let reqData =
      RequestData.fromExpressRequest<GetWorkspaceCollaboratorsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {pageSize, workspaceId: workspace.resourceId}
      );
    let result = await getWorkspaceCollaborators(reqData);
    assertEndpointResultOk(result);
    let fetchedUsers = result.collaborators;

    expect(result.page).toBe(page);
    expect(result.collaborators).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );

    page = 1;
    reqData =
      RequestData.fromExpressRequest<GetWorkspaceCollaboratorsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {page, pageSize, workspaceId: workspace.resourceId}
      );
    result = await getWorkspaceCollaborators(reqData);
    assertEndpointResultOk(result);
    fetchedUsers = fetchedUsers.concat(result.collaborators);

    const fetchedUsersMap = indexArray(fetchedUsers, {
      indexer: nextUser => nextUser.resourceId,
    });
    const seedUsersMap = indexArray(seedUsers, {
      indexer: seedUser => seedUser.resourceId,
    });
    expect(
      sortStringListLexicographically(Object.keys(fetchedUsersMap))
    ).toEqual(sortStringListLexicographically(Object.keys(seedUsersMap)));
    seedUsers.forEach(seedUser => {
      expect(fetchedUsersMap[seedUser.resourceId]).toBeTruthy();
    });
    fetchedUsers.forEach(fetchedUser => {
      expect(seedUsersMap[fetchedUser.resourceId]).toBeTruthy();
    });

    expect(result.page).toBe(page);
    expect(result.collaborators).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );
  });
});
