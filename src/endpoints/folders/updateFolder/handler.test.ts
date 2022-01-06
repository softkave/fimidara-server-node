import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertFolderForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import deleteFolder from './handler';
import {IUpdateFolderParams} from './types';

test('folder returned', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {folder: folder01} = await insertFolderForTest(
    context,
    userToken,
    organization.organizationId
  );

  const updateInput = {
    description: faker.lorem.paragraph(),
    maxFileSizeInBytes: 9_000_000_000,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      path: folder01.name,
      folder: updateInput,
    }
  );

  const result = await deleteFolder(context, instData);
  assertEndpointResultOk(result);
  expect(result.folder.folderId).toBe(folder01.folderId);
  expect(result.folder).toEqual(updateInput);
});
