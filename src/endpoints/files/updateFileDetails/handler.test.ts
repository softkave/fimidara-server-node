import * as faker from 'faker';
import {IBaseContext} from '../../contexts/BaseContext';
import RequestData from '../../RequestData';
import {
  assertContext,
  assertEndpointResultOk,
  getTestBaseContext,
  insertFileForTest,
  insertOrganizationForTest,
  insertUserForTest,
  mockExpressRequestWithUserToken,
} from '../../test-utils/test-utils';
import FileQueries from '../queries';
import {fileExtractor} from '../utils';
import updateFileDetails from './handler';
import {
  IUpdateFileDetailsEndpointParams,
  IUpdateFileDetailsInput,
} from './types';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('file updated', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {file} = await insertFileForTest(
    context,
    userToken,
    organization.resourceId
  );

  const updateInput: IUpdateFileDetailsInput = {
    description: faker.lorem.paragraph(),
    mimetype: 'application/octet-stream',
  };

  const instData =
    RequestData.fromExpressRequest<IUpdateFileDetailsEndpointParams>(
      mockExpressRequestWithUserToken(userToken),
      {
        organizationId: organization.resourceId,
        filepath: file.name,
        file: updateInput,
      }
    );

  const result = await updateFileDetails(context, instData);
  assertEndpointResultOk(result);
  expect(result.file.resourceId).toEqual(file.resourceId);
  expect(result.file).toMatchObject(updateInput);

  const updatedFile = await context.data.file.assertGetItem(
    FileQueries.getById(file.resourceId)
  );

  expect(fileExtractor(updatedFile)).toMatchObject(result.file);
  expect(updatedFile).toMatchObject(updateInput);
});
