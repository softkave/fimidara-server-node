import * as faker from 'faker';
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
import deleteFolder from './handler';
import {IListFolderContentEndpointParams} from './types';

/**
 * TODO:
 * - Test root path
 */

test('folder content returned', async () => {
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

  const instData = RequestData.fromExpressRequest<IListFolderContentEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      path: folder01.name,
    }
  );

  const result = await deleteFolder(context, instData);
  assertEndpointResultOk(result);
  expect(result.folders).toContain(folder02);
  expect(result.files).toContain(file);
});
