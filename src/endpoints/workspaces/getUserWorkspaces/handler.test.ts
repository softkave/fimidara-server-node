import {kSystemSessionAgent} from '../../../utils/agent';
import {appAssert} from '../../../utils/assertion';
import {calculatePageSize, getResourceId} from '../../../utils/fns';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {kSemanticModels} from '../../contexts/injection/injectables';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generate/workspace';
import {expectContainsNoneIn} from '../../testUtils/helpers/assertion';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getUserWorkspaces from './handler';
import {GetUserWorkspacesEndpointParams} from './types';

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
