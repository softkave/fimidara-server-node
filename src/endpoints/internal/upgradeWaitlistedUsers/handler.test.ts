import {kAppResourceType} from '../../../definitions/system';
import {
  upgradedFromWaitlistEmailHTML,
  UpgradedFromWaitlistEmailProps,
  upgradedFromWaitlistEmailText,
  upgradedFromWaitlistEmailTitle,
} from '../../../emailTemplates/upgradedFromWaitlist';
import {kSystemSessionAgent} from '../../../utils/agent';
import {appAssert} from '../../../utils/assertion';
import {extractResourceIdList} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getNewIdForResource} from '../../../utils/resource';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injectables';
import RequestData from '../../RequestData';
import {generateAndInsertUserListForTest} from '../../testUtils/generate/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import upgradeWaitlistedUsers from './handler';
import {UpgradeWaitlistedUsersEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('upgradeWaitlistedUsers', () => {
  test('returns waitlisted users', async () => {
    const {userToken, user} = await insertUserForTest();
    const [waitlistedUsers] = await Promise.all([
      generateAndInsertUserListForTest(/** count */ 2, () => ({
        isOnWaitlist: true,
      })),
      kSemanticModels.utils().withTxn(opts => {
        return assignWorkspaceToUser(
          kSystemSessionAgent,
          kUtilsInjectables.runtimeConfig().appWorkspaceId,
          user.resourceId,
          opts
        );
      }),
    ]);

    const waitlistedUserIds = extractResourceIdList(waitlistedUsers);
    const result = await upgradeWaitlistedUsers(
      RequestData.fromExpressRequest<UpgradeWaitlistedUsersEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {userIds: waitlistedUserIds}
      )
    );
    assertEndpointResultOk(result);

    const users = await kSemanticModels.user().getManyByQuery({
      resourceId: {$in: waitlistedUserIds},
      isOnWaitlist: false,
    });
    const usersMap = indexArray(users, {path: 'resourceId'});
    expect(users).toHaveLength(waitlistedUsers.length);

    users.forEach(user => {
      expect(usersMap[user.resourceId]).toBeTruthy();

      // confirm email sent
      const suppliedConfig = kUtilsInjectables.suppliedConfig();
      appAssert(suppliedConfig.clientLoginLink);
      appAssert(suppliedConfig.clientSignupLink);
      appAssert(suppliedConfig.appDefaultEmailAddressFrom);

      const upgradedFromWaitlistEmailProps: UpgradedFromWaitlistEmailProps = {
        signupLink: suppliedConfig.clientSignupLink,
        loginLink: suppliedConfig.clientLoginLink,
        firstName: user.firstName,
      };
      const html = upgradedFromWaitlistEmailHTML(upgradedFromWaitlistEmailProps);
      const text = upgradedFromWaitlistEmailText(upgradedFromWaitlistEmailProps);
      expect(kUtilsInjectables.email().sendEmail).toHaveBeenCalledWith({
        subject: upgradedFromWaitlistEmailTitle,
        body: {html, text},
        destination: [user.email],
        source: suppliedConfig.appDefaultEmailAddressFrom,
      });
    });
  });

  test('fails if user not part of root workspace', async () => {
    const {userToken} = await insertUserForTest();

    await expectErrorThrown(() => {
      return upgradeWaitlistedUsers(
        RequestData.fromExpressRequest<UpgradeWaitlistedUsersEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {userIds: [getNewIdForResource(kAppResourceType.User)]}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
