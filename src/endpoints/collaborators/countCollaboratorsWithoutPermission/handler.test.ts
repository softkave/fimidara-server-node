import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generateData/collaborator';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countCollaboratorsWithoutPermission from './handler';
import {CountCollaboratorsWithoutPermissionEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

describe('countCollaboratorsWithoutPermission', () => {
  test('count', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const seedCount = 15;
    await generateAndInsertCollaboratorListForTest(
      SYSTEM_SESSION_AGENT,
      workspace.resourceId,
      seedCount
    );

    const instData =
      RequestData.fromExpressRequest<CountCollaboratorsWithoutPermissionEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countCollaboratorsWithoutPermission(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(seedCount);
  });
});
