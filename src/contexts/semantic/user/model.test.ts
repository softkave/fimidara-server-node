import {faker} from '@faker-js/faker';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {generateAndInsertUserListForTest} from '../../../endpoints/testHelpers/generate/user.js';
import {completeTests} from '../../../endpoints/testHelpers/helpers/testFns.js';
import {initTests} from '../../../endpoints/testHelpers/utils.js';
import {kIjxSemantic} from '../../ijx/injectables.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('UserSemanticModel', () => {
  test.each([{count: 3}, {count: 0}])(
    'countUsersCreatedBetween, with users count=$count',
    async params => {
      const start = faker.number.int({min: 1});
      const end = faker.number.int({min: start + 1});

      const preCount = await kIjxSemantic
        .user()
        .countUsersCreatedBetween(start, end);

      const [expectedUsers] = await Promise.all([
        generateAndInsertUserListForTest(params.count, () => ({
          createdAt: faker.number.int({min: start, max: end}),
        })),
        generateAndInsertUserListForTest(/** count */ 2, () => ({
          createdAt: start - faker.number.int({min: 1, max: start}),
        })),
        generateAndInsertUserListForTest(/** count */ 2, () => ({
          createdAt: end + faker.number.int({min: 1, max: end}),
        })),
      ]);

      const actualUsersCount = await kIjxSemantic
        .user()
        .countUsersCreatedBetween(start, end);

      expect(expectedUsers).toHaveLength(params.count);
      expect(actualUsersCount).toBe(params.count + preCount);
    }
  );
});
