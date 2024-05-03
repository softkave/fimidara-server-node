import {kSystemSessionAgent} from '../../../utils/agent.js';
import {calculatePageSize} from '../../../utils/fns.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import AssignedItemQueries from '../../assignedItems/queries.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generate/collaborator.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
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
    const instData =
      RequestData.fromExpressRequest<GetWorkspaceCollaboratorsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await getWorkspaceCollaborators(instData);
    assertEndpointResultOk(result);
    const updatedUser = await populateUserWorkspaces(
      await kSemanticModels.user().assertGetOneByQuery({resourceId: user.resourceId})
    );
    expect(result.collaborators).toContainEqual(
      collaboratorExtractor(updatedUser, workspace.resourceId)
    );
  });

  test('pagination', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const seedCount = 15;
    await generateAndInsertCollaboratorListForTest(
      kSystemSessionAgent,
      workspace.resourceId,
      seedCount
    );
    const count = await kSemanticModels
      .assignedItem()
      .countByQuery(
        AssignedItemQueries.getByAssignedItem(workspace.resourceId, workspace.resourceId)
      );
    expect(count).toBeGreaterThanOrEqual(seedCount);

    const pageSize = 10;
    let page = 0;
    let instData =
      RequestData.fromExpressRequest<GetWorkspaceCollaboratorsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {pageSize, workspaceId: workspace.resourceId}
      );
    let result = await getWorkspaceCollaborators(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.collaborators).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetWorkspaceCollaboratorsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspaceCollaborators(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.collaborators).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
