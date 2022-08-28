import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {insertTagForTest} from '../../test-utils/helpers/tag';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getWorkspaceTags from './handler';
import {IGetWorkspaceTagsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getWorkspaceTags', () => {
  test("workspace's tag returned", async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const {tag: tag01} = await insertTagForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const {tag: tag02} = await insertTagForTest(
      context,
      userToken,
      workspace.resourceId
    );

    const instData =
      RequestData.fromExpressRequest<IGetWorkspaceTagsEndpointParams>(
        mockExpressRequestWithUserToken(userToken),
        {workspaceId: workspace.resourceId}
      );

    const result = await getWorkspaceTags(context, instData);
    assertEndpointResultOk(result);
    expect(result.tags).toContainEqual(tag01);
    expect(result.tags).toContainEqual(tag02);
  });
});
