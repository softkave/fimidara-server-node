import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertCollaboratorListForTest} from '../../testHelpers/generate/collaborator.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
    const count = await kIjxSemantic.assignedItem().countByQuery({
      workspaceId: workspace.resourceId,
      assignedItemId: workspace.resourceId,
    });
    expect(count).toBeGreaterThanOrEqual(seedCount);

    const reqData =
      RequestData.fromExpressRequest<CountWorkspaceCollaboratorsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countWorkspaceCollaborators(reqData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
