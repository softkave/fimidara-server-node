import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {calculatePageSize} from '../../../utils/fns';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import AssignedItemQueries from '../../assignedItems/queries';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generateData/collaborator';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
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

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getWorkspaceCollaborators', () => {
  test('workspace collaborators returned', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const instData = RequestData.fromExpressRequest<GetWorkspaceCollaboratorsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getWorkspaceCollaborators(context, instData);
    assertEndpointResultOk(result);
    const updatedUser = await populateUserWorkspaces(
      context,
      await context.semantic.user.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(user.resourceId)
      )
    );
    expect(result.collaborators).toContainEqual(
      collaboratorExtractor(updatedUser, workspace.resourceId)
    );
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const seedCount = 15;
    await generateAndInsertCollaboratorListForTest(
      context,
      SYSTEM_SESSION_AGENT,
      workspace.resourceId,
      seedCount
    );
    const count = await context.semantic.assignedItem.countByQuery(
      AssignedItemQueries.getByAssignedItem(workspace.resourceId, workspace.resourceId)
    );
    expect(count).toBeGreaterThanOrEqual(seedCount);

    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetWorkspaceCollaboratorsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getWorkspaceCollaborators(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.collaborators).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetWorkspaceCollaboratorsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspaceCollaborators(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.collaborators).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
