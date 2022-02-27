import assert = require('assert');
import {IBaseContext} from '../../contexts/BaseContext';
import {getBodyFromStream} from '../../contexts/FilePersistenceProviderContext';
import {
  assertContext,
  getTestBaseContext,
  insertFileForTest,
  insertOrganizationForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import FileQueries from '../queries';
import {fileExtractor} from '../utils';

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

  const savedBuffer =
    persistedFile.body && (await getBodyFromStream(persistedFile.body));

  assert(savedBuffer);
  expect(buffer.equals(savedBuffer)).toBe(true);

  const savedFile = await context.data.file.assertGetItem(
    FileQueries.getById(file.resourceId)
  );

  expect(file).toMatchObject(fileExtractor(savedFile));
});
