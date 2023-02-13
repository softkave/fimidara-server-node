import {calculatePageSize} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertProgramAccessTokenListForTest} from '../../test-utils/generate-data/programAccessToken';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getWorkspaceProgramAccessTokens from './handler';
import {IGetWorkspaceProgramAccessTokensEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getWorkspaceProgramAccessTokens', () => {
  test("workspace's program access token returned", async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {token: token01} = await insertProgramAccessTokenForTest(context, userToken, workspace.resourceId);
    const {token: token02} = await insertProgramAccessTokenForTest(context, userToken, workspace.resourceId);
    const instData = RequestData.fromExpressRequest<IGetWorkspaceProgramAccessTokensEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getWorkspaceProgramAccessTokens(context, instData);
    assertEndpointResultOk(result);
    expect(result.tokens).toContainEqual(token01);
    expect(result.tokens).toContainEqual(token02);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertProgramAccessTokenListForTest(context, 15, {workspaceId: workspace.resourceId});
    const count = await context.data.programAccessToken.countByQuery({workspaceId: workspace.resourceId});
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetWorkspaceProgramAccessTokensEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getWorkspaceProgramAccessTokens(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<IGetWorkspaceProgramAccessTokensEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspaceProgramAccessTokens(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
