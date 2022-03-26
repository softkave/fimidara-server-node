import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import FileQueries from '../../files/queries';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertFileForTest,
  insertFolderForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import deleteFolder from './handler';
import {IDeleteFolderParams} from './types';

/**
 * TODO:
 * - Test artifacts like files and children folders are deleted
 * - Test path strings
 */

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
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
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {folder: folder01} = await insertFolderForTest(
    context,
    userToken,
    organization.resourceId
  );

  const {folder: folder02} = await insertFolderForTest(
    context,
    userToken,
    organization.resourceId,
    {
      path: folder01.namePath
        .concat(faker.lorem.word())
        .join(folderConstants.nameSeparator),
    }
  );

  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.resourceId,
    {
      filePath: folder01.namePath
        .concat(faker.lorem.word())
        .join(folderConstants.nameSeparator),
    }
  );

  const instData = RequestData.fromExpressRequest<IDeleteFolderParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.resourceId,
      path: folder01.name,
    }
  );

  const result = await deleteFolder(context, instData);
  assertEndpointResultOk(result);
  await assertFolderDeleted(context, folder01.resourceId);
  await assertFolderDeleted(context, folder02.resourceId);
  await assertFileDeleted(context, file.resourceId);
});
