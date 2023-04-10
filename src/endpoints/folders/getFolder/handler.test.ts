import {IBaseContext} from '../../contexts/types';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {addRootnameToPath} from '../utils';
import getFolder from './handler';
import {IGetFolderEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('folder returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {folder: folder01} = await insertFolderForTest(context, userToken, workspace);

  const instData = RequestData.fromExpressRequest<IGetFolderEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      folderpath: addRootnameToPath(folder01.name, workspace.rootname),
    }
  );

  const result = await getFolder(context, instData);
  assertEndpointResultOk(result);
  expect(result.folder).toEqual(folder01);
});
