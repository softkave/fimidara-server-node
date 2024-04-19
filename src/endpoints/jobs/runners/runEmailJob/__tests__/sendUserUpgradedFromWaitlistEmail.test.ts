import {kEmailJobType} from '../../../../../definitions/job';
import {kFimidaraResourceType} from '../../../../../definitions/system';
import {kUpgradeFromWaitlistEmailArtifacts} from '../../../../../emailTemplates/upgradedFromWaitlist';
import {getNewIdForResource} from '../../../../../utils/resource';
import {IEmailProviderContext} from '../../../../contexts/email/types';
import {kUtilsInjectables} from '../../../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../../../contexts/injection/register';
import MockTestEmailProviderContext from '../../../../testUtils/context/email/MockTestEmailProviderContext';
import {generateAndInsertUserListForTest} from '../../../../testUtils/generate/user';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {sendUserUpgradedFromWaitlistEmail} from '../sendUserUpgradedFromWaitlistEmail';

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
    kRegisterUtilsInjectables.email(testEmailProvider);

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
    expect(params.source).toBe(kUtilsInjectables.suppliedConfig().senderEmailAddress);
  });
});
