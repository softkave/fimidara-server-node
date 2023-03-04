import {IBaseContext} from '../../contexts/types';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {
  assertContext,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';

let context: IBaseContext | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await context?.dispose();
});

describe('addTag', () => {
  test('tag added', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await insertTagForTest(context, userToken, workspace.resourceId);
  });
});
