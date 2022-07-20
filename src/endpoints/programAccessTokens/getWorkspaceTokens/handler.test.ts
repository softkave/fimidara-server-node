import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertProgramAccessTokenForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import getWorkspaceProgramAccessTokens from './handler';
import {IGetWorkspaceProgramAccessTokensEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test("workspace's program access token returned", async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {token: token01} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const {token: token02} = await insertProgramAccessTokenForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData =
    RequestData.fromExpressRequest<IGetWorkspaceProgramAccessTokensEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {workspaceId: workspace.resourceId}
    );

  const result = await getWorkspaceProgramAccessTokens(context, instData);
  assertEndpointResultOk(result);
  expect(result.tokens).toContainEqual(token01);
  expect(result.tokens).toContainEqual(token02);
});
