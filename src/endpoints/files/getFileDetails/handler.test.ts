import {BaseContextType} from '../../contexts/types';
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
import {stringifyFileNamePath} from '../utils';
import getFileDetails from './handler';
import {GetFileDetailsEndpointParams} from './types';

let context: BaseContextType | null = null;

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
  const {file} = await insertFileForTest(context, userToken, workspace);

  const instData = RequestData.fromExpressRequest<GetFileDetailsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {filepath: stringifyFileNamePath(file, workspace.rootname)}
  );
  const result = await getFileDetails(context, instData);
  assertEndpointResultOk(result);
  expect(result.file).toEqual(file);
});
