import {
  getTestBaseContext,
  insertFileForTest,
  insertOrganizationForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import FileQueries from '../queries';

test('file returned', async () => {
  const context = getTestBaseContext();
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
  expect(persistedFile.body).toBe(buffer);

  const savedFile = await context.data.file.assertGetItem(
    FileQueries.getById(file.resourceId)
  );

  expect(savedFile).toBe(file);
});
