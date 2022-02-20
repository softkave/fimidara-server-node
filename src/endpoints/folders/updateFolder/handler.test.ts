import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertFolderForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import deleteFolder from './handler';
import {IUpdateFolderInput, IUpdateFolderParams} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('folder updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {folder: folder01} = await insertFolderForTest(
    context,
    userToken,
    organization.resourceId
  );

  const updateInput: IUpdateFolderInput = {
    description: faker.lorem.words(20),
    maxFileSizeInBytes: 9_000_000_000,
  };

  const instData = RequestData.fromExpressRequest<IUpdateFolderParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.resourceId,
      path: folder01.name,
      folder: updateInput,
    }
  );

  const result = await deleteFolder(context, instData);
  assertEndpointResultOk(result);
  expect(result.folder.resourceId).toEqual(folder01.resourceId);
  expect(result.folder).toMatchObject(updateInput);
});
