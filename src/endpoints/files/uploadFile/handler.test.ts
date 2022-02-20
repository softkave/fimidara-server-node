import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
  getTestBaseContext,
  insertFileForTest,
  insertOrganizationForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import FileQueries from '../queries';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('file returned', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {file, buffer} = await insertFileForTest(
    context,
    userToken,
    organization.resourceId
  );

  const persistedFile = await context.fileBackend.getFile({
    bucket: context.appVariables.S3Bucket,
    key: file.resourceId,
  });

  expect(persistedFile).toBeTruthy();
  expect(persistedFile.body).toEqual(buffer);

  const savedFile = await context.data.file.assertGetItem(
    FileQueries.getById(file.resourceId)
  );

  expect(savedFile).toEqual(file);
});
