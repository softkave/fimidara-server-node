import {IBaseContext} from '../../contexts/BaseContext';
import FileQueries from '../../files/queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertFileForTest,
  insertWorkspaceForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteFile from './handler';
import {IDeleteFileEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

async function assertFileDeleted(context: IBaseContext, id: string) {
  const exists = await context.data.file.checkItemExists(
    FileQueries.getById(id)
  );

  expect(exists).toBeFalsy();
}

test('file deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {file} = await insertFileForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const instData = RequestData.fromExpressRequest<IDeleteFileEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      workspaceId: workspace.resourceId,
      filepath: file.name,
    }
  );

  const result = await deleteFile(context, instData);
  assertEndpointResultOk(result);
  await assertFileDeleted(context, file.resourceId);
});
