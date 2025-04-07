import {calculatePageSize} from 'softkave-js-utils';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {getResourceId} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import EndpointReusableQueries from '../../queries.js';
import {generateAndInsertWorkspaceListForTest} from '../../testHelpers/generate/workspace.js';
import {expectContainsNoneIn} from '../../testHelpers/helpers/assertion.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
    const reqData =
      RequestData.fromExpressRequest<GetUserWorkspacesEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {}
      );
    const result = await getUserWorkspaces(reqData);
    assertEndpointResultOk(result);
    expect(result.workspaces).toHaveLength(3);
    expect(result.workspaces).toContainEqual(workspace01);
    expect(result.workspaces).toContainEqual(workspace02);
    expect(result.workspaces).toContainEqual(workspace03);
  });

  test('pagination', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const workspaces = await generateAndInsertWorkspaceListForTest(15);
    await kIjxSemantic
      .utils()
      .withTxn(opts =>
        Promise.all(
          workspaces.map(w =>
            assignWorkspaceToUser(
              kSystemSessionAgent,
              w.resourceId,
              rawUser.resourceId,
              opts
            )
          )
        )
      );

    appAssert(userToken.forEntityId);
    const user = await populateUserWorkspaces(
      await kIjxSemantic
        .user()
        .assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(userToken.forEntityId)
        )
    );
    const count = user.workspaces.length;
    const pageSize = 10;
    let page = 0;
    let reqData =
      RequestData.fromExpressRequest<GetUserWorkspacesEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {page, pageSize}
      );
    const result00 = await getUserWorkspaces(reqData);
    assertEndpointResultOk(result00);
    expect(result00.page).toBe(page);
    expect(result00.workspaces).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );

    page = 1;
    reqData = RequestData.fromExpressRequest<GetUserWorkspacesEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {page, pageSize}
    );
    const result01 = await getUserWorkspaces(reqData);
    assertEndpointResultOk(result01);
    expectContainsNoneIn(
      result00.workspaces,
      result01.workspaces,
      getResourceId
    );
    expect(result01.page).toBe(page);
    expect(result01.workspaces).toHaveLength(
      calculatePageSize(count, pageSize, page)
    );
  });
});
