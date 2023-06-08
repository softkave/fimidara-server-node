import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../testUtils/generateData/collaborator';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countCollaboratorsWithoutPermission from './handler';
import {CountCollaboratorsWithoutPermissionEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('countCollaboratorsWithoutPermission', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const seedCount = 15;
    await generateAndInsertCollaboratorListForTest(
      context,
      SYSTEM_SESSION_AGENT,
      workspace.resourceId,
      seedCount
    );

    const instData =
      RequestData.fromExpressRequest<CountCollaboratorsWithoutPermissionEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countCollaboratorsWithoutPermission(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(seedCount);
  });
});
