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
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import upgradeWaitlistedUsers from './handler';
import {UpgradeWaitlistedUsersEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('upgradeWaitlistedUsers', () => {
  test('returns waitlisted users', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const [waitlistedUsers] = await Promise.all([
      generateAndInsertUserListForTest(context, /** count */ 2, () => ({
        isOnWaitlist: true,
      })),
      context.semantic.utils.withTxn(context, opts => {
        assertContext(context);
        return assignWorkspaceToUser(
          context,
          SYSTEM_SESSION_AGENT,
          context.appVariables.appWorkspaceId,
          user.resourceId,
          opts
        );
      }),
    ]);

    const waitlistedUserIds = extractResourceIdList(waitlistedUsers);
    const result = await upgradeWaitlistedUsers(
      context,
      RequestData.fromExpressRequest<UpgradeWaitlistedUsersEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {userIds: waitlistedUserIds}
      )
    );
    assertEndpointResultOk(result);

    const users = await context.semantic.user.getManyByQuery({
      resourceId: {$in: waitlistedUserIds},
      isOnWaitlist: false,
    });
    const usersMap = indexArray(users, {path: 'resourceId'});
    expect(users).toHaveLength(waitlistedUsers.length);

    users.forEach(user => {
      assertContext(context);
      expect(usersMap[user.resourceId]).toBeTruthy();

      // confirm email sent
      const upgradedFromWaitlistEmailProps: UpgradedFromWaitlistEmailProps = {
        signupLink: context.appVariables.clientSignupLink,
        loginLink: context.appVariables.clientLoginLink,
        firstName: user.firstName,
      };
      const html = upgradedFromWaitlistEmailHTML(upgradedFromWaitlistEmailProps);
      const text = upgradedFromWaitlistEmailText(upgradedFromWaitlistEmailProps);
      expect(context.email.sendEmail).toHaveBeenCalledWith(context, {
        subject: upgradedFromWaitlistEmailTitle,
        body: {html, text},
        destination: [user.email],
        source: context.appVariables.appDefaultEmailAddressFrom,
      });
    });
  });

  test('fails if user not part of root workspace', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);

    await expectErrorThrown(() => {
      assertContext(context);
      return upgradeWaitlistedUsers(
        context,
        RequestData.fromExpressRequest<UpgradeWaitlistedUsersEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {userIds: [getNewIdForResource(AppResourceTypeMap.User)]}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
