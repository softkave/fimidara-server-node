import {AppResourceType, systemAgent} from '../../../definitions/system';
import {calculatePageSize} from '../../../utils/fns';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import AssignedItemQueries from '../../assignedItems/queries';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../test-utils/generate-data/collaborator';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {collaboratorExtractor} from '../utils';
import getWorkspaceCollaborators from './handler';
import {IGetWorkspaceCollaboratorsEndpointParams} from './types';

/**
 * TODO:
 * - Check that only permitted collaborators are returned
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getWorkspaceCollaborators', () => {
  test('workspace collaborators returned', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const instData = RequestData.fromExpressRequest<IGetWorkspaceCollaboratorsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getWorkspaceCollaborators(context, instData);
    assertEndpointResultOk(result);
    const updatedUser = await populateUserWorkspaces(
      context,
      await context.data.user.assertGetOneByQuery(EndpointReusableQueries.getById(user.resourceId))
    );
    expect(result.collaborators).toContainEqual(collaboratorExtractor(updatedUser, workspace.resourceId));
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertCollaboratorListForTest(context, systemAgent, workspace.resourceId, 15);
    const count = await context.data.assignedItem.countByQuery(
      AssignedItemQueries.getByAssignedItem(workspace.resourceId, workspace.resourceId, AppResourceType.Workspace)
    );
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetWorkspaceCollaboratorsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getWorkspaceCollaborators(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toContainEqual(page);
    expect(result.collaborators).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<IGetWorkspaceCollaboratorsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspaceCollaborators(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toContainEqual(page);
    expect(result.collaborators).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
