import {SYSTEM_SESSION_AGENT} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {populateUserWorkspaces} from '../../assignedItems/getAssignedItems';
import {IBaseContext} from '../../contexts/types';
import {disposeGlobalUtils} from '../../globalUtils';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generateData/workspace';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import countUserWorkspaces from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await disposeGlobalUtils();
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
    appAssert(userToken.separateEntityId);
    const user = await populateUserWorkspaces(
      context,
      await context.semantic.user.assertGetOneByQuery(
        EndpointReusableQueries.getByResourceId(userToken.separateEntityId)
      )
    );
    const count = user.workspaces.length;
    const instData = RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(userToken),
      {}
    );
    const result = await countUserWorkspaces(context, instData);
    assertEndpointResultOk(result);
    expect(result.count).toBe(count);
  });
});
