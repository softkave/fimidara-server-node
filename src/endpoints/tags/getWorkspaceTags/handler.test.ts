import {calculatePageSize} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertTagListForTest} from '../../testHelpers/generate/tag.js';
import {insertTagForTest} from '../../testHelpers/helpers/tag.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import getWorkspaceTags from './handler.js';
import {GetWorkspaceTagsEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getWorkspaceTags', () => {
  test("workspace's tag returned", async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const {tag: tag01} = await insertTagForTest(
      userToken,
      workspace.resourceId
    );
    const {tag: tag02} = await insertTagForTest(
      userToken,
      workspace.resourceId
    );
    const reqData =
      RequestData.fromExpressRequest<GetWorkspaceTagsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId}
      );
    const result = await getWorkspaceTags(reqData);
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
    const count = await kIjxSemantic.tag().countByQuery({
      workspaceId: workspace.resourceId,
    });
    const pageSize = 10;
    let page = 0;
    let reqData =
      RequestData.fromExpressRequest<GetWorkspaceTagsEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {page, pageSize, workspaceId: workspace.resourceId}
      );
    let result = await getWorkspaceTags(reqData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tags).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    reqData = RequestData.fromExpressRequest<GetWorkspaceTagsEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize, workspaceId: workspace.resourceId}
    );
    result = await getWorkspaceTags(reqData);
    assertEndpointResultOk(result);
    expect(result.page).toBe(page);
    expect(result.tags).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
