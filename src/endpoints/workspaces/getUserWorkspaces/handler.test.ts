import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {appAssert} from '../../../utils/assertion';
import {calculatePageSize, getResourceId} from '../../../utils/fns';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generateData/workspace';
import {expectContainsNoneIn} from '../../testUtils/helpers/assertion';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getUserWorkspaces from './handler';
import {GetUserWorkspacesEndpointParams} from './types';

let context: BaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getUserWorkspaces', () => {
  test('user workspaces are returned', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace: workspace01} = await insertWorkspaceForTest(context, userToken);
    const {workspace: workspace02} = await insertWorkspaceForTest(context, userToken);
    const {workspace: workspace03} = await insertWorkspaceForTest(context, userToken);
    const instData = RequestData.fromExpressRequest<GetUserWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
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
    await executeWithMutationRunOptions(context, opts =>
      Promise.all(
        workspaces.map(w =>
          assignWorkspaceToUser(
            context!,
            SYSTEM_SESSION_AGENT,
            w.resourceId,
            rawUser.resourceId,
            opts
          )
        )
      )
    );
    appAssert(userToken.separateEntityId);
    const user = await populateUserWorkspaces(
      context,
      await context.semantic.user.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(userToken.separateEntityId)
      )
    );
    const count = user.workspaces.length;
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetUserWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize}
    );
    const result00 = await getUserWorkspaces(context, instData);
    assertEndpointResultOk(result00);
    expect(result00.page).toBe(page);
    expect(result00.workspaces).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetUserWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize}
    );
    const result01 = await getUserWorkspaces(context, instData);
    assertEndpointResultOk(result01);
    expectContainsNoneIn(result00.workspaces, result01.workspaces, getResourceId);
    expect(result01.page).toBe(page);
    expect(result01.workspaces).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
