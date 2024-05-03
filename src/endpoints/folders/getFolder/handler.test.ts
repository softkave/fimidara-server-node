import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, beforeAll, afterAll, expect} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {addRootnameToPath} from '../utils.js';
import getFolder from './handler.js';
import {GetFolderEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
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
