import {calculatePageSize} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {generateAndInsertTagListForTest} from '../../testUtils/generateData/tag';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getWorkspaceTags from './handler';
import {GetWorkspaceTagsEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('getWorkspaceTags', () => {
  test("workspace's tag returned", async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {tag: tag01} = await insertTagForTest(userToken, workspace.resourceId);
    const {tag: tag02} = await insertTagForTest(userToken, workspace.resourceId);
    const instData = RequestData.fromExpressRequest<GetWorkspaceTagsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await getWorkspaceTags(instData);
    assertEndpointResultOk(result);
    expect(result.tags).toContainEqual(tag01);
    expect(result.tags).toContainEqual(tag02);
  });

  test('pagination', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await generateAndInsertTagListForTest(15, {
      workspaceId: workspace.resourceId,
    });
    const count = await kSemanticModels.tag().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetWorkspaceTagsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    let result = await getWorkspaceTags(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tags).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetWorkspaceTagsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspaceTags(instData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tags).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
