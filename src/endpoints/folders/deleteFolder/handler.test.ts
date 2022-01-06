import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import FileQueries from '../../files/queries';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertFileForTest,
  insertFolderForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import {folderConstants} from '../constants';
import FolderQueries from '../queries';
import deleteFolder from './handler';
import {IDeleteFolderParams} from './types';

/**
 * TODO:
 * - Test artifacts like files and children folders are deleted
 * - Test path strings
 */

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
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {folder: folder01} = await insertFolderForTest(
    context,
    userToken,
    organization.organizationId
  );

  const {folder: folder02} = await insertFolderForTest(
    context,
    userToken,
    organization.organizationId,
    {
      path: folder01.namePath
        .concat(faker.lorem.word())
        .join(folderConstants.nameSeparator),
    }
  );

  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.organizationId,
    {
      path: folder01.namePath
        .concat(faker.lorem.word())
        .join(folderConstants.nameSeparator),
    }
  );

  const instData = RequestData.fromExpressRequest<IDeleteFolderParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      path: folder01.name,
    }
  );

  const result = await deleteFolder(context, instData);
  assertEndpointResultOk(result);
  assertFolderDeleted(context, folder01.folderId);
  assertFolderDeleted(context, folder02.folderId);
  assertFileDeleted(context, file.fileId);
});
