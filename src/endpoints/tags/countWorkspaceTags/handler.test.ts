import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertTagListForTest} from '../../test-utils/generate-data/tag';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import countWorkspaceTags from './handler';
import {ICountWorkspaceTagsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countWorkspaceTags', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await generateAndInsertTagListForTest(context, 15, {workspaceId: workspace.resourceId});
    const count = await context.data.tag.countByQuery({workspaceId: workspace.resourceId});
    const instData = RequestData.fromExpressRequest<ICountWorkspaceTagsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {workspaceId: workspace.resourceId}
    );
    const result = await countWorkspaceTags(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
