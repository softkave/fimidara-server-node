import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getUserWorkspaces from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('user workspaces are returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace: workspace01} = await insertWorkspaceForTest(
    context,
    userToken
  );
  const {workspace: workspace02} = await insertWorkspaceForTest(
    context,
    userToken
  );
  const {workspace: workspace03} = await insertWorkspaceForTest(
    context,
    userToken
  );

  const instData = RequestData.fromExpressRequest(
    mockExpressRequestWithUserToken(userToken)
  );

  const result = await getUserWorkspaces(context, instData);
  assertEndpointResultOk(result);

  expect(result.workspaces).toHaveLength(3);
  expect(result.workspaces).toContainEqual(workspace01);
  expect(result.workspaces).toContainEqual(workspace02);
  expect(result.workspaces).toContainEqual(workspace03);
});
