import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {extractResourceIdList} from '../../../utils/fns';
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
import getWaitlistedUsers from './handler';
import {GetWaitlistedUsersEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getWaitlistedUsers', () => {
  test('returns waitlisted users', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const [waitlistedUsers, upgradedUsers] = await Promise.all([
      generateAndInsertUserListForTest(context, /** count */ 2, () => ({isOnWaitlist: true})),
      generateAndInsertUserListForTest(context, /** count */ 2),
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

    const result = await getWaitlistedUsers(
      context,
      RequestData.fromExpressRequest<GetWaitlistedUsersEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {}
      )
    );
    assertEndpointResultOk(result);
    const waitlistedUserIds = extractResourceIdList(waitlistedUsers);
    const upgradedUsersIds = extractResourceIdList(upgradedUsers);
    const resultWaitlistedUserIds = extractResourceIdList(result.users);
    waitlistedUserIds.forEach(id => expect(resultWaitlistedUserIds).toContain(id));
    upgradedUsersIds.forEach(id => expect(resultWaitlistedUserIds).not.toContain(id));
  });

  test('fails if user not part of root workspace', async () => {
    assertContext(context);
    const {userToken} = await insertUserForTest(context);

    await expectErrorThrown(() => {
      assertContext(context);
      return getWaitlistedUsers(
        context,
        RequestData.fromExpressRequest<GetWaitlistedUsersEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
