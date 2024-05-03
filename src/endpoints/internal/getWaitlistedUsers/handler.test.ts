import {kSystemSessionAgent} from '../../../utils/agent.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables.js';
import RequestData from '../../RequestData.js';
import {generateAndInsertUserListForTest} from '../../testUtils/generate/user.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {test, expect, beforeAll, afterAll, describe} from 'vitest';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {PermissionDeniedError} from '../../users/errors.js';
import getWaitlistedUsers from './handler.js';
import {GetWaitlistedUsersEndpointParams} from './types.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
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
          kSystemSessionAgent,
          kUtilsInjectables.runtimeConfig().appWorkspaceId,
          user.resourceId,
          opts
        );
      }, /** reuseTxn */ true),
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
