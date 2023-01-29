import {systemAgent} from '../../../definitions/system';
import {calculatePageSize} from '../../../utils/fns';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateAndInsertWorkspaceListForTest} from '../../test-utils/generate-data/workspace';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getUserWorkspaces from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('getUserWorkspaces', () => {
  test('user workspaces are returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace: workspace01} = await insertWorkspaceForTest(context, userToken);
    const {workspace: workspace02} = await insertWorkspaceForTest(context, userToken);
    const {workspace: workspace03} = await insertWorkspaceForTest(context, userToken);
    const instData = RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken));
    const result = await getUserWorkspaces(context, instData);
    assertEndpointResultOk(result);
    expect(result.workspaces).toHaveLength(3);
    expect(result.workspaces).toContainEqual(workspace01);
    expect(result.workspaces).toContainEqual(workspace02);
    expect(result.workspaces).toContainEqual(workspace03);
  });

  test('pagination', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const workspaces = await generateAndInsertWorkspaceListForTest(context, 15);
    await Promise.all(workspaces.map(w => assignWorkspaceToUser(context!, systemAgent, w.resourceId, rawUser)));
    const user = await populateUserWorkspaces(
      context,
      await context.data.user.assertGetOneByQuery(EndpointReusableQueries.getById(userToken.userId))
    );
    const count = user.workspaces.length;
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken), {page, pageSize});
    let result = await getUserWorkspaces(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toContainEqual(page);
    expect(result.workspaces).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken), {page, pageSize});
    result = await getUserWorkspaces(context, instData);
    assertEndpointResultOk(result);
    expect(result.page).toContainEqual(page);
    expect(result.workspaces).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
