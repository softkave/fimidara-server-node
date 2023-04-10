import {IBaseContext} from '../../contexts/types';
import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTest} from '../../testUtils/helpers/test';
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
  await completeTest({context});
});

describe('addTag', () => {
  test('tag added', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    await insertTagForTest(context, userToken, workspace.resourceId);
  });
});
