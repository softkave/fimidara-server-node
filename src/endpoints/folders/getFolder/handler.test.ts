import RequestData from '../../RequestData';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {addRootnameToPath} from '../utils';
import getFolder from './handler';
import {GetFolderEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

test('folder returned', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {folder: folder01} = await insertFolderForTest(userToken, workspace);

  const instData = RequestData.fromExpressRequest<GetFolderEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {folderpath: addRootnameToPath(folder01.name, workspace.rootname)}
  );

  const result = await getFolder(instData);
  assertEndpointResultOk(result);
  expect(result.folder).toEqual(folder01);
});
