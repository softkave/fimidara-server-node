import {kSystemSessionAgent} from '../../../utils/agent';
import {kSemanticModels} from '../../contexts/injection/injectables';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generate/collaborator';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countWorkspaceCollaborators from './handler';
import {CountWorkspaceCollaboratorsEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countWorkspaceCollaborators', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const seedCount = 15;
    await generateAndInsertCollaboratorListForTest(
      kSystemSessionAgent,
      workspace.resourceId,
      seedCount
    );
    const count = await kSemanticModels.assignedItem().countByQuery({
      workspaceId: workspace.resourceId,
      assignedItemId: workspace.resourceId,
    });
    expect(count).toBeGreaterThanOrEqual(seedCount);

    const instData =
      RequestData.fromExpressRequest<CountWorkspaceCollaboratorsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countWorkspaceCollaborators(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
