import {afterAll, beforeAll, describe, expect, test} from 'vitest';
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
import countCollaboratorsWithoutPermission from './handler.js';
import {CountCollaboratorsWithoutPermissionEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countCollaboratorsWithoutPermission', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const seedCount = 5;
    await generateAndInsertCollaboratorListForTest(
      kSystemSessionAgent,
      workspace.resourceId,
      seedCount
    );

    const reqData =
      RequestData.fromExpressRequest<CountCollaboratorsWithoutPermissionEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countCollaboratorsWithoutPermission(reqData);
    assertEndpointResultOk(result);

    expect(result.count).toBe(seedCount);
  });
});
