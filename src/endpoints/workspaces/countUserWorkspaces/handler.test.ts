import {SYSTEM_SESSION_AGENT} from '../../../definitions/system';
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
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import countUserWorkspaces from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('countUserWorkspaces', () => {
  test('count', async () => {
    assertContext(context);
    const {userToken, rawUser} = await insertUserForTest(context);
    const workspaces = await generateAndInsertWorkspaceListForTest(context, 15);
    await Promise.all(
      workspaces.map(w =>
        assignWorkspaceToUser(context!, SYSTEM_SESSION_AGENT, w.resourceId, rawUser)
      )
    );
    const user = await populateUserWorkspaces(
      context,
      await context.data.user.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(userToken.userId)
      )
    );
    const count = user.workspaces.length;
    const instData = RequestData.fromExpressRequest(mockExpressRequestWithUserToken(userToken), {});
    const result = await countUserWorkspaces(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
