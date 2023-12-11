import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {appAssert} from '../../../utils/assertion';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generateData/workspace';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countUserWorkspaces from './handler';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe('countUserWorkspaces', () => {
  test('count', async () => {
    const {userToken, rawUser} = await insertUserForTest();
    const workspaces = await generateAndInsertWorkspaceListForTest(15);
    await kSemanticModels
      .utils()
      .withTxn(opts =>
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
      await kSemanticModels
        .user()
        .assertGetOneByQuery(
          EndpointReusableQueries.getByResourceId(userToken.separateEntityId)
        )
    );
    const count = user.workspaces.length;
    const instData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(userToken),
      {}
    );
    const result = await countUserWorkspaces(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
