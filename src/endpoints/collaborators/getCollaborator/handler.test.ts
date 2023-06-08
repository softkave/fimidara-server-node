import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {BaseContextType} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
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
import getCollaborator from './handler';
import {GetCollaboratorEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('collaborator returned', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<GetCollaboratorEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId: workspace.resourceId,
      collaboratorId: user.resourceId,
    }
  );

  const result = await getCollaborator(context, instData);
  assertEndpointResultOk(result);
  expect(result.collaborator).toMatchObject(
    collaboratorExtractor(
      await populateUserWorkspaces(
        context,
        await context.semantic.user.assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(user.resourceId)
        )
      ),
      workspace.resourceId
    )
  );
});
