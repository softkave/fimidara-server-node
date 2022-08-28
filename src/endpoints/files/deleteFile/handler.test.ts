import {IBaseContext} from '../../contexts/types';
import FileQueries from '../../files/queries';
import {addRootnameToPath} from '../../folders/utils';
import RequestData from '../../RequestData';
import {waitForRequestPendingJobs} from '../../test-utils/helpers/reqData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteFile from './handler';
import {IDeleteFileEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
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
  const {file, reqData} = await insertFileForTest(
    context,
    userToken,
    workspace
  );

  const instData = RequestData.fromExpressRequest<IDeleteFileEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {filepath: addRootnameToPath(file.name, workspace.rootname)}
  );

  const result = await deleteFile(context, instData);
  assertEndpointResultOk(result);
  await assertFileDeleted(context, file.resourceId);
  await waitForRequestPendingJobs(context, reqData);
});
