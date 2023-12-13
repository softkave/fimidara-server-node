import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {collaboratorExtractor} from '../utils';
import getCollaborator from './handler';
import {GetCollaboratorEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

test('collaborator returned', async () => {
  const {userToken, user} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const instData = RequestData.fromExpressRequest<GetCollaboratorEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId: workspace.resourceId,
      collaboratorId: user.resourceId,
    }
  );

  const result = await getCollaborator(instData);
  assertEndpointResultOk(result);
  expect(result.collaborator).toMatchObject(
    collaboratorExtractor(
      await populateUserWorkspaces(
        await kSemanticModels
          .user()
          .assertGetOneByQuery(EndpointReusableQueries.getByResourceId(user.resourceId))
      ),
      workspace.resourceId
    )
  );
});
