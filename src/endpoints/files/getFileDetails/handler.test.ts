import {IBaseContext} from '../../contexts/types';
import {addRootnameToPath} from '../../folders/utils';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import getFileDetails from './handler';
import {IGetFileDetailsEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('file details returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {file, reqData} = await insertFileForTest(context, userToken, workspace);

  const instData = RequestData.fromExpressRequest<IGetFileDetailsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {filepath: addRootnameToPath(file.name, workspace.rootname)}
  );

  const result = await getFileDetails(context, instData);
  assertEndpointResultOk(result);
  expect(result.file).toEqual(file);
});
