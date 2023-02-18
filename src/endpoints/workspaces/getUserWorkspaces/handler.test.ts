import {systemAgent} from '../../../definitions/system';
import {calculatePageSize, expectContainsNoneIn, getResourceId} from '../../../utils/fns';
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
import {IGetUserWorkspacesEndpointParams} from './types';

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
    const instData = RequestData.fromExpressRequest<IGetUserWorkspacesEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {}
    );
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
    await Promise.all(
      workspaces.map(w => assignWorkspaceToUser(context!, systemAgent, w.resourceId, rawUser))
    );
    const user = await populateUserWorkspaces(
      context,
      await context.data.user.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(userToken.userId)
      )
    );
    const count = user.workspaces.length;
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<IGetUserWorkspacesEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {page, pageSize}
    );
    const result00 = await getUserWorkspaces(context, instData);
    assertEndpointResultOk(result00);
    expect(result00.page).toBe(page);
    expect(result00.workspaces).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<IGetUserWorkspacesEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {page, pageSize}
    );
    const result01 = await getUserWorkspaces(context, instData);
    assertEndpointResultOk(result01);
    expectContainsNoneIn(result00.workspaces, result01.workspaces, getResourceId);
    expect(result01.page).toBe(page);
    expect(result01.workspaces).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
