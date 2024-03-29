import {kSystemSessionAgent} from '../../../utils/agent';
import {calculatePageSize} from '../../../utils/fns';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import AssignedItemQueries from '../../assignedItems/queries';
import {kSemanticModels} from '../../contexts/injection/injectables';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generate/collaborator';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {collaboratorExtractor} from '../utils';
import getWorkspaceCollaborators from './handler';
import {GetWorkspaceCollaboratorsEndpointParams} from './types';

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
