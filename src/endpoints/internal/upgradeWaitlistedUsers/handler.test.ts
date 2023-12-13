import {AppResourceTypeMap} from '../../../definitions/system';
import {
  upgradedFromWaitlistEmailHTML,
  UpgradedFromWaitlistEmailProps,
  upgradedFromWaitlistEmailText,
  upgradedFromWaitlistEmailTitle,
} from '../../../emailTemplates/upgradedFromWaitlist';
import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {extractResourceIdList} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getNewIdForResource} from '../../../utils/resource';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import RequestData from '../../RequestData';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import upgradeWaitlistedUsers from './handler';
import {UpgradeWaitlistedUsersEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
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
          SYSTEM_SESSION_AGENT,
          kUtilsInjectables.config().appWorkspaceId,
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
      const upgradedFromWaitlistEmailProps: UpgradedFromWaitlistEmailProps = {
        signupLink: kUtilsInjectables.config().clientSignupLink,
        loginLink: kUtilsInjectables.config().clientLoginLink,
        firstName: user.firstName,
      };
      const html = upgradedFromWaitlistEmailHTML(upgradedFromWaitlistEmailProps);
      const text = upgradedFromWaitlistEmailText(upgradedFromWaitlistEmailProps);
      expect(kUtilsInjectables.email().sendEmail).toHaveBeenCalledWith({
        subject: upgradedFromWaitlistEmailTitle,
        body: {html, text},
        destination: [user.email],
        source: kUtilsInjectables.config().appDefaultEmailAddressFrom,
      });
    });
  });

  test('fails if user not part of root workspace', async () => {
    const {userToken} = await insertUserForTest();

    await expectErrorThrown(() => {
      return upgradeWaitlistedUsers(
        RequestData.fromExpressRequest<UpgradeWaitlistedUsersEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {userIds: [getNewIdForResource(AppResourceTypeMap.User)]}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
