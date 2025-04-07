import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {IEmailProviderContext} from '../../../../../contexts/email/types.js';
import {kIjxUtils} from '../../../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../../../contexts/ijx/register.js';
import {kEmailJobType} from '../../../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../../../definitions/system.js';
import {kUpgradeFromWaitlistEmailArtifacts} from '../../../../../emailTemplates/upgradedFromWaitlist.js';
import {getNewIdForResource} from '../../../../../utils/resource.js';
import MockTestEmailProviderContext from '../../../../testHelpers/context/email/MockTestEmailProviderContext.js';
import {generateAndInsertUserListForTest} from '../../../../testHelpers/generate/user.js';
import {completeTests} from '../../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../../testHelpers/utils.js';
import {sendUserUpgradedFromWaitlistEmail} from '../sendUserUpgradedFromWaitlistEmail.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('sendUserUpgradedFromWaitlistEmail', () => {
  test('sendEmail called', async () => {
    const [user] = await generateAndInsertUserListForTest(1);
    const testEmailProvider = new MockTestEmailProviderContext();
    kRegisterIjxUtils.email(testEmailProvider);

    await sendUserUpgradedFromWaitlistEmail(
      getNewIdForResource(kFimidaraResourceType.Job),
      {
        emailAddress: [user.email],
        userId: [user.resourceId],
        type: kEmailJobType.upgradedFromWaitlist,
      }
    );

    const call = testEmailProvider.sendEmail.mock.lastCall as Parameters<
      IEmailProviderContext['sendEmail']
    >;
    const params = call[0];
    expect(params.body.html).toBeTruthy();
    expect(params.body.text).toBeTruthy();
    expect(params.destination).toEqual([user.email]);
    expect(params.subject).toBe(kUpgradeFromWaitlistEmailArtifacts.title);
    expect(params.source).toBe(kIjxUtils.suppliedConfig().senderEmailAddress);
  });
});
