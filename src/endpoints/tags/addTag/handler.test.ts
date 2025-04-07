import {afterAll, beforeAll, describe, test} from 'vitest';
import {insertTagForTest} from '../../testHelpers/helpers/tag.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
} from '../../testHelpers/utils.js';

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
