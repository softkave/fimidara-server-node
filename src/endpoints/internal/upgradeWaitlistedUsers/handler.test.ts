import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../contexts/data/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kRegisterUtilsInjectables} from '../../../contexts/injection/register.js';
import {
  EmailJobParams,
  Job,
  kEmailJobType,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import {indexArray} from '../../../utils/indexArray.js';
import {getNewIdForResource} from '../../../utils/resource.js';
import RequestData from '../../RequestData.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import MockTestEmailProviderContext from '../../testUtils/context/email/MockTestEmailProviderContext.js';
import {generateAndInsertUserListForTest} from '../../testUtils/generate/user.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {PermissionDeniedError} from '../../users/errors.js';
import upgradeWaitlistedUsers from './handler.js';
import {UpgradeWaitlistedUsersEndpointParams} from './types.js';

beforeEach(async () => {
  await initTests();
});

afterEach(async () => {
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
          kUtilsInjectables.runtimeConfig().rootWorkspaceId,
          user.resourceId,
          opts
        );
      }),
    ]);

    kRegisterUtilsInjectables.email(new MockTestEmailProviderContext());

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

    await kUtilsInjectables.promises().flush();
    await Promise.all(
      users.map(async user => {
        expect(usersMap[user.resourceId]).toBeTruthy();

        // const query: DataQuery<EmailMessage> = {
        //   type: kEmailMessageType.upgradedFromWaitlist,
        //   emailAddress: {$all: [user.email]},
        //   userId: {$all: [user.resourceId]},
        // };
        // const dbEmailMessage = await kSemanticModels.emailMessage().getOneByQuery(query);
        // expect(dbEmailMessage).toBeTruthy();

        const query: DataQuery<Job<EmailJobParams>> = {
          type: kJobType.email,
          params: {
            $objMatch: {
              type: kEmailJobType.upgradedFromWaitlist,
              emailAddress: {$all: [user.email]},
              userId: {$all: [user.resourceId]},
            },
          },
        };
        const dbJob = await kSemanticModels.job().getOneByQuery(query);
        expect(dbJob).toBeTruthy();
      })
    );
  });

  test('fails if user not part of root workspace', async () => {
    const {userToken} = await insertUserForTest();

    await expectErrorThrown(() => {
      return upgradeWaitlistedUsers(
        RequestData.fromExpressRequest<UpgradeWaitlistedUsersEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {userIds: [getNewIdForResource(kFimidaraResourceType.User)]}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
