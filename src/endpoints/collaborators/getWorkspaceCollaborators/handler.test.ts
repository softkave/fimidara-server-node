import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
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

test('workspace collaborators returned', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const instData =
    RequestData.fromExpressRequest<IGetWorkspaceCollaboratorsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
      }
    );

  const result = await getWorkspaceCollaborators(context, instData);
  assertEndpointResultOk(result);
  const updatedUser = await populateUserWorkspaces(
    context,
    await context.data.user.assertGetItem(
      EndpointReusableQueries.getById(user.resourceId)
    )
  );

  expect(result.collaborators).toContainEqual(
    collaboratorExtractor(updatedUser, workspace.resourceId)
  );
});
