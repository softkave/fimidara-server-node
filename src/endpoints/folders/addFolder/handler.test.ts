import {IBaseContext} from '../../contexts/BaseContext';
import {
  assertContext,
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

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

test('folder created', async () => {
  assertContext(context);
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

  expect(folder).toEqual(savedFolder);
});
