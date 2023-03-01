import {SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import AssignedItemQueries from '../../assignedItems/queries';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertCollaboratorListForTest} from '../../test-utils/generate-data/collaborator';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import countWorkspaceCollaborators from './handler';
import {ICountWorkspaceCollaboratorsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countWorkspaceCollaborators', () => {
  test.only('count', async () => {
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
    const count = await context.data.assignedItem.countByQuery(
      AssignedItemQueries.getByAssignedItem(workspace.resourceId, workspace.resourceId)
    );
    expect(count).toBeGreaterThanOrEqual(seedCount);

    const instData = RequestData.fromExpressRequest<ICountWorkspaceCollaboratorsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await countWorkspaceCollaborators(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
