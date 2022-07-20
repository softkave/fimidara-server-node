import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {addRootnameToPath} from '../utils';
import getFolder from './handler';
import {IGetFolderEndpointParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

test('folder returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {folder: folder01} = await insertFolderForTest(
    context,
    userToken,
    workspace
  );

  const instData = RequestData.fromExpressRequest<IGetFolderEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      folderpath: addRootnameToPath(folder01.name, workspace.rootname),
    }
  );

  const result = await getFolder(context, instData);
  assertEndpointResultOk(result);
  expect(result.folder).toEqual(folder01);
});
