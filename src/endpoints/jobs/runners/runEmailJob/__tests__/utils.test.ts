import assert from 'assert';
import {generateAndInsertUserListForTest} from '../../../../testUtils/generate/user';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {getUserFromEmailJobParams} from '../utils';

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
