import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {extractResourceIdList} from '../../../utils/fns';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import RequestData from '../../RequestData';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import getWaitlistedUsers from './handler';
import {GetWaitlistedUsersEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('getWaitlistedUsers', () => {
  test('returns waitlisted users', async () => {
    const {userToken, user} = await insertUserForTest();
    const [waitlistedUsers, upgradedUsers] = await Promise.all([
      generateAndInsertUserListForTest(/** count */ 2, () => ({
        isOnWaitlist: true,
      })),
      generateAndInsertUserListForTest(/** count */ 2),
      kSemanticModels.utils().withTxn(opts => {
        return assignWorkspaceToUser(
          SYSTEM_SESSION_AGENT,
          kUtilsInjectables.config().appWorkspaceId,
          user.resourceId,
          opts
        );
      }),
    ]);

    const result = await getWaitlistedUsers(
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
    const {userToken} = await insertUserForTest();

    await expectErrorThrown(() => {
      return getWaitlistedUsers(
        RequestData.fromExpressRequest<GetWaitlistedUsersEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
