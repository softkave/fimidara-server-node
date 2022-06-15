import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteWorkspace from './handler';
import {IDeleteWorkspaceParams} from './types';

/**
 * TODO:
 * - Confirm that workspace artifacts are deleted
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('workspace deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const instData = RequestData.fromExpressRequest<IDeleteWorkspaceParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      workspaceId: workspace.resourceId,
    }
  );

  const result = await deleteWorkspace(context, instData);
  assertEndpointResultOk(result);
  const savedWorkspace = await context.cacheProviders.workspace.getById(
    context,
    workspace.resourceId
  );
  expect(savedWorkspace).toBeFalsy();
});
