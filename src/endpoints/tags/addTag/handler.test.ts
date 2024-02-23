import {insertTagForTest} from '../../testUtils/helpers/tag';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testUtils/testUtils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('addTag', () => {
  test('tag added', async () => {
    const {userToken} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    await insertTagForTest(userToken, workspace.resourceId);
  });
});
