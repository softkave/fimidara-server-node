import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertProgramAccessTokenListForTest} from '../../test-utils/generate-data/programAccessToken';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import countWorkspaceProgramAccessTokens from './handler';
import {ICountWorkspaceProgramAccessTokensEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countWorkspaceProgramAccessTokens', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertProgramAccessTokenListForTest(context, 15, {
      workspaceId: workspace.resourceId,
    });
    const count = await context.data.programAccessToken.countByQuery({
      workspaceId: workspace.resourceId,
    });
    const instData =
      RequestData.fromExpressRequest<ICountWorkspaceProgramAccessTokensEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await countWorkspaceProgramAccessTokens(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
