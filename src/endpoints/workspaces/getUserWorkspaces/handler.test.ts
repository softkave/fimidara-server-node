import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getUserWorkspaces from './handler';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
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
