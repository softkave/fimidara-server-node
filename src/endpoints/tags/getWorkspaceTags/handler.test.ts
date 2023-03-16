import {calculatePageSize} from '../../../utils/fns';
import {IBaseContext} from '../../contexts/types';
import {disposeGlobalUtils} from '../../globalUtils';
import RequestData from '../../RequestData';
import {generateAndInsertTagListForTest} from '../../testUtils/generateData/tag';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getWorkspaceTags from './handler';
import {IGetWorkspaceTagsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await disposeGlobalUtils();
  await context?.dispose();
});

describe('getWorkspaceTags', () => {
  test("workspace's tag returned", async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {tag: tag01} = await insertTagForTest(context, userToken, workspace.resourceId);
    const {tag: tag02} = await insertTagForTest(context, userToken, workspace.resourceId);
    const instData = RequestData.fromExpressRequest<IGetWorkspaceTagsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getWorkspaceTags(context, instData);
    assertEndpointResultOk(result);
    expect(result.tags).toContainEqual(tag01);
    expect(result.tags).toContainEqual(tag02);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertTagListForTest(context, 15, {workspaceId: workspace.resourceId});
    const count = await context.semantic.tag.countByQuery({workspaceId: workspace.resourceId});
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetWorkspaceTagsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getWorkspaceTags(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tags).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<IGetWorkspaceTagsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspaceTags(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tags).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
