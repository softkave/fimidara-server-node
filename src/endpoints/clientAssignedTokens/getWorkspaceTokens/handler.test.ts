import {calculatePageSize} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertClientAssignedTokenListForTest} from '../../test-utils/generate-data/clientAssignedToken';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertClientAssignedTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getWorkspaceClientAssignedTokens from './handler';
import {IGetWorkspaceClientAssignedTokensEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getWorkspaceClientAssignedTokens', () => {
  test("workspace's client assigned tokens returned", async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {token: token01} = await insertClientAssignedTokenForTest(context, userToken, workspace.resourceId);
    const {token: token02} = await insertClientAssignedTokenForTest(context, userToken, workspace.resourceId);
    const instData = RequestData.fromExpressRequest<IGetWorkspaceClientAssignedTokensEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getWorkspaceClientAssignedTokens(context, instData);
    assertEndpointResultOk(result);
    expect(result.tokens).toContainEqual(token01);
    expect(result.tokens).toContainEqual(token02);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertClientAssignedTokenListForTest(context, 15, {workspaceId: workspace.resourceId});
    const count = await context.data.clientAssignedToken.countByQuery({workspaceId: workspace.resourceId});
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetWorkspaceClientAssignedTokensEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getWorkspaceClientAssignedTokens(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<IGetWorkspaceClientAssignedTokensEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {pageSize, page, workspaceId: workspace.resourceId}
    );
    result = await getWorkspaceClientAssignedTokens(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tokens).toHaveLength(calculatePageSize(count, pageSize, page));
  });

  // TODO
  // test('returns all if can read type', async () => {
  //   assertContext(context);
  // });

  // test('returns all and excludes denied items if can read type', async () => {
  //   assertContext(context);
  // });

  // test('returns specific items if can read specific items', async () => {
  //   assertContext(context);
  // });

  // test('throws error if no access', async () => {
  //   assertContext(context);
  // });
});
