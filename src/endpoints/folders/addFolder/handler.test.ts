import {
  getTestBaseContext,
  insertFolderForTest,
  insertOrganizationForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';
import FolderQueries from '../queries';

/**
 * TODO:
 * - Test different folder paths
 * - Test on root
 */

test('folder created', async () => {
  const context = getTestBaseContext();
  const {userToken} = await insertUserForTest(context);
  const {organization} = await insertOrganizationForTest(context, userToken);
  const {folder} = await insertFolderForTest(
    context,
    userToken,
    organization.resourceId
  );

  const savedFolder = await context.data.folder.assertGetItem(
    FolderQueries.getById(folder.resourceId)
  );

  expect(folder).toBe(savedFolder);
});
