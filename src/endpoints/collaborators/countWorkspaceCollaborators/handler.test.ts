import {kSystemSessionAgent} from '../../../utils/agent.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generate/collaborator.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, describe, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import countWorkspaceCollaborators from './handler.js';
import {CountWorkspaceCollaboratorsEndpointParams} from './types.js';

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
