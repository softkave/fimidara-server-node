import assert from 'assert';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {generateAndInsertUserListForTest} from '../../../../testHelpers/generate/user.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {getUserFromEmailJobParams} from '../utils.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runEmailJob utils', () => {
  test('getUserFromEmailJobParams by email address', async () => {
    const [user] = await generateAndInsertUserListForTest(1);
    const {user: emailRecipient} = await getUserFromEmailJobParams({
      userId: [],
      emailAddress: [user.email],
    });

    assert(emailRecipient);
    expect(user.resourceId).toBe(emailRecipient.resourceId);
  });

  test('getUserFromEmailJobParams by user ID', async () => {
    const [user] = await generateAndInsertUserListForTest(1);
    const {user: emailRecipient} = await getUserFromEmailJobParams({
      userId: [user.resourceId],
      emailAddress: [],
    });

    assert(emailRecipient);
    expect(user.resourceId).toBe(emailRecipient.resourceId);
  });

  test('getUserFromEmailJobParams, empty ID and email', async () => {
    const {user: emailRecipient} = await getUserFromEmailJobParams({
      userId: [],
      emailAddress: [],
    });

    expect(emailRecipient).toBeFalsy();
  });
});
