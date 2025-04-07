import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems.js';
import EndpointReusableQueries from '../../queries.js';
import {generateAndInsertWorkspaceListForTest} from '../../testHelpers/generate/workspace.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
    const reqData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(userToken),
      {}
    );
    const result = await countUserWorkspaces(reqData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
