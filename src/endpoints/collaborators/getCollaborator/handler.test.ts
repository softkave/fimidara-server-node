import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kSemanticModels} from '../../contexts/injection/injectables';
import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {collaboratorExtractor} from '../utils';
import getCollaborator from './handler';
import {GetCollaboratorEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('collaborator returned', async () => {
  const {userToken, user} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const instData = RequestData.fromExpressRequest<GetCollaboratorEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {workspaceId: workspace.resourceId, collaboratorId: user.resourceId}
  );

  const result = await getCollaborator(instData);
  assertEndpointResultOk(result);
  expect(result.collaborator).toMatchObject(
    collaboratorExtractor(
      await populateUserWorkspaces(
        await kSemanticModels.user().assertGetOneByQuery({resourceId: user.resourceId})
      ),
      workspace.resourceId
    )
  );
});
