import {IBaseContext} from '../../contexts/BaseContext';
import {insertTagForTest} from '../../test-utils/helpers/tag';
import {
  assertContext,
  getTestBaseContext,
  insertWorkspaceForTest,
  insertUserForTest,
} from '../../test-utils/test-utils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await getTestBaseContext();
});

afterAll(async () => {
  await getTestBaseContext.release();
});

describe('addTag', () => {
  test('tag added', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await insertTagForTest(context, userToken, workspace.resourceId);
  });
});
