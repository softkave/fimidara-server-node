import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {collaboratorExtractor} from '../utils.js';
import getCollaborator from './handler.js';
import {GetCollaboratorEndpointParams} from './types.js';

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
