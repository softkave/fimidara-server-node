import {faker} from '@faker-js/faker';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {folderConstants} from '../constants';
import {addRootnameToPath} from '../utils';
import listFolderContent from './handler';
import {IListFolderContentEndpointParams} from './types';

/**
 * TODO:
 * - Test root path
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('folder content returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {folder: folder01} = await insertFolderForTest(
    context,
    userToken,
    workspace.resourceId
  );

  const {folder: folder02} = await insertFolderForTest(
    context,
    userToken,
    workspace.resourceId,
    {
      folderpath: folder01.namePath
        .concat(faker.lorem.word())
        .join(folderConstants.nameSeparator),
    }
  );

  const {file} = await insertFileForTest(context, userToken, workspace, {
    filepath: addRootnameToPath(
      folder01.namePath
        .concat(faker.lorem.word())
        .join(folderConstants.nameSeparator),
      workspace.rootname
    ),
  });

  const instData =
    RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        workspaceId: workspace.resourceId,
        folderpath: folder01.name,
      }
    );

  const result = await listFolderContent(context, instData);
  assertEndpointResultOk(result);
  expect(result.folders).toContainEqual(folder02);
  expect(result.files).toContainEqual(file);
});
