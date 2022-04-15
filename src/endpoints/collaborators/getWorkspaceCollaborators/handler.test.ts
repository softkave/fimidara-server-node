import {withUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/BaseContext';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertUserForTest,
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
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
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
  const updatedUser = await withUserWorkspaces(
    context,
    await context.data.user.assertGetItem(
      EndpointReusableQueries.getById(user.resourceId)
    )
  );

  expect(result.collaborators).toContainEqual(
    collaboratorExtractor(updatedUser, workspace.resourceId)
  );
});
