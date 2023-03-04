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
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {collaboratorExtractor} from '../utils';
import getCollaborator from './handler';
import {IGetCollaboratorEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('collaborator returned', async () => {
  assertContext(context);
  const {userToken, user} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IGetCollaboratorEndpointParams>(
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
        await context.data.user.assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(user.resourceId)
        )
      ),
      workspace.resourceId
    )
  );
});
