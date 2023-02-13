import {IBaseContext} from '../../contexts/types';
import EndpointReusableQueries from '../../queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteWorkspace from './handler';
import {IDeleteWorkspaceEndpointParams} from './types';

/**
 * TODO:
 * - Confirm that workspace artifacts are deleted
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('workspace deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IDeleteWorkspaceEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      workspaceId: workspace.resourceId,
    }
  );

  const result = await deleteWorkspace(context, instData);
  assertEndpointResultOk(result);
  const savedWorkspace = await context.data.workspace.getOneByQuery(
    EndpointReusableQueries.getByResourceId(workspace.resourceId)
  );
  expect(savedWorkspace).toBeFalsy();
});
