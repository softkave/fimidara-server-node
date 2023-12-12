import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTest} from '../../testUtils/helpers/test';
import {
  initTest,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('addTag', () => {
  test('tag added', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await insertTagForTest(userToken, workspace.resourceId);
  });
});
