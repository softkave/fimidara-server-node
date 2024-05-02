import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {calculatePageSize, getResourceId} from '../../../utils/fns.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import EndpointReusableQueries from '../../queries.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generate/workspace.js';
import {expectContainsNoneIn} from '../../testUtils/helpers/assertion.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import getUserWorkspaces from './handler.js';
import {GetUserWorkspacesEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getUserWorkspaces', () => {
  test('user workspaces are returned', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace: workspace01} = await insertWorkspaceForTest(userToken);
    const {workspace: workspace02} = await insertWorkspaceForTest(userToken);
    const {workspace: workspace03} = await insertWorkspaceForTest(userToken);
    const instData = RequestData.fromExpressRequest<GetUserWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {}
    );
    const result = await getUserWorkspaces(instData);
    assertEndpointResultOk(result);
    expect(result.workspaces).toHaveLength(3);
    expect(result.workspaces).toContainEqual(workspace01);
    expect(result.workspaces).toContainEqual(workspace02);
    expect(result.workspaces).toContainEqual(workspace03);
  });

  test('pagination', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const workspaces = await generateAndInsertWorkspaceListForTest(15);
    await kSemanticModels
      .utils()
      .withTxn(
        opts =>
          Promise.all(
            workspaces.map(w =>
              assignWorkspaceToUser(
                kSystemSessionAgent,
                w.resourceId,
                rawUser.resourceId,
                opts
              )
            )
          ),
        /** reuseTxn */ true
      );

    appAssert(userToken.forEntityId);
    const user = await populateUserWorkspaces(
      await kSemanticModels
        .user()
        .assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(userToken.forEntityId)
        )
    );
    const count = user.workspaces.length;
    const pageSize = 10;
    let page = 0;
    let instData = RequestData.fromExpressRequest<GetUserWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize}
    );
    const result00 = await getUserWorkspaces(instData);
    assertEndpointResultOk(result00);
    expect(result00.page).toBe(page);
    expect(result00.workspaces).toHaveLength(calculatePageSize(count, pageSize, page));

    page = 1;
    instData = RequestData.fromExpressRequest<GetUserWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize}
    );
    const result01 = await getUserWorkspaces(instData);
    assertEndpointResultOk(result01);
    expectContainsNoneIn(result00.workspaces, result01.workspaces, getResourceId);
    expect(result01.page).toBe(page);
    expect(result01.workspaces).toHaveLength(calculatePageSize(count, pageSize, page));
  });
});
