import * as faker from 'faker';
import RequestData from '../../RequestData';
import {
  assertEndpointResultOk,
  getTestBaseContext,
  insertFileForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils';
import FileQueries from '../queries';
import updateFileDetails from './handler';
import {
  IUpdateFileDetailsEndpointParams,
  IUpdateFileDetailsInput,
} from './types';

test('file updated', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.organizationId
  );

  const updateInput: IUpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData = RequestData.fromExpressRequest<IUpdateFileDetailsEndpointParams>(
    mockExpressRequestWithUserToken(userToken),
    {
      organizationId: organization.organizationId,
      path: file.name,
      file: updateInput,
    }
  );

  const result = await updateFileDetails(context, instData);
  assertEndpointResultOk(result);
  expect(result.file.fileId).toBe(file.fileId);
  expect(result.file).toMatchObject(updateInput);

  const updatedFile = await context.data.file.assertGetItem(
    FileQueries.getById(file.fileId)
  );

  expect(updatedFile).toBe(result.file);
  expect(updatedFile).toMatchObject(updateInput);
});
