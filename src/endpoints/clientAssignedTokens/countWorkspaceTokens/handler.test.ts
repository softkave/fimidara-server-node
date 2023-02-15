import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertClientAssignedTokenListForTest} from '../../test-utils/generate-data/clientAssignedToken';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import countWorkspaceClientAssignedTokens from './handler';
import {ICountWorkspaceClientAssignedTokensEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countWorkspaceClientAssignedTokens', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertClientAssignedTokenListForTest(context, 15, {
      workspaceId: workspace.resourceId,
    });
    const count = await context.data.clientAssignedToken.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const instData =
      RequestData.fromExpressRequest<ICountWorkspaceClientAssignedTokensEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countWorkspaceClientAssignedTokens(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
