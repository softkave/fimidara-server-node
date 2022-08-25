import {IBaseContext} from '../../contexts/BaseContext';
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
import getFileDetails from './handler';
import {IGetFileDetailsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('file details returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {file, reqData} = await insertFileForTest(
    context,
    userToken,
    workspace
  );

  const instData =
    RequestData.fromExpressRequest<IGetFileDetailsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {filepath: addRootnameToPath(file.name, workspace.rootname)}
    );

  const result = await getFileDetails(context, instData);
  assertEndpointResultOk(result);
  expect(result.file).toEqual(file);
  await waitForRequestPendingJobs(context, reqData);
});
