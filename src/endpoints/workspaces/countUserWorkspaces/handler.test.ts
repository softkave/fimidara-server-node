import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import {kSemanticModels} from '../../contexts/injection/injectables.js';
import EndpointReusableQueries from '../../queries.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generate/workspace.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import countUserWorkspaces from './handler.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('countUserWorkspaces', () => {
  test('count', async () => {
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
    const instData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(userToken),
      {}
    );
    const result = await countUserWorkspaces(instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
