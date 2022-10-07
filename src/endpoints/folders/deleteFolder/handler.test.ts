import {IBaseContext} from '../../contexts/types';
import FileQueries from '../../files/queries';
import RequestData from '../../RequestData';
import {generateTestFolderName} from '../../test-utils/generate-data/folder';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertFileForTest,
  insertFolderForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import {addRootnameToPath} from '../utils';
import deleteFolder from './handler';
import {IDeleteFolderEndpointParams} from './types';

/**
 * TODO:
 * - Test artifacts like files and children folders are deleted
 * - Test path strings
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

async function assertFolderDeleted(context: IBaseContext, id: string) {
  const exists = await context.data.folder.checkItemExists(
    FolderQueries.getById(id)
  );

  expect(exists).toBeFalsy();
}

async function assertFileDeleted(context: IBaseContext, id: string) {
  const exists = await context.data.file.checkItemExists(
    FileQueries.getById(id)
  );

  expect(exists).toBeFalsy();
}

test('folder deleted', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {folder: folder01} = await insertFolderForTest(
    context,
    userToken,
    workspace
  );

  const {folder: folder02} = await insertFolderForTest(
    context,
    userToken,
    workspace,
    {
      folderpath: addRootnameToPath(
        folder01.namePath
          .concat(generateTestFolderName())
          .join(folderConstants.nameSeparator),
        workspace.rootname
      ),
    }
  );

  const {file} = await insertFileForTest(context, userToken, workspace, {
    filepath: addRootnameToPath(
      folder01.namePath
        .concat(generateTestFolderName())
        .join(folderConstants.nameSeparator),
      workspace.rootname
    ),
  });

  const instData = RequestData.fromExpressRequest<IDeleteFolderEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      folderpath: addRootnameToPath(folder01.name, workspace.rootname),
    }
  );

  const result = await deleteFolder(context, instData);
  assertEndpointResultOk(result);
  await assertFolderDeleted(context, folder01.resourceId);
  await assertFolderDeleted(context, folder02.resourceId);
  await assertFileDeleted(context, file.resourceId);
});
