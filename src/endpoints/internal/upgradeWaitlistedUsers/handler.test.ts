import {afterEach, beforeEach, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {kRegisterIjxUtils} from '../../../contexts/ijx/register.js';
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
import MockTestEmailProviderContext from '../../testHelpers/context/email/MockTestEmailProviderContext.js';
import {generateAndInsertUserListForTest} from '../../testHelpers/generate/user.js';
import {expectErrorThrown} from '../../testHelpers/helpers/error.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
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
      kIjxSemantic.utils().withTxn(opts => {
        return assignWorkspaceToUser(
          kSystemSessionAgent,
          kIjxUtils.runtimeConfig().appWorkspaceId,
          user.resourceId,
          opts
        );
      }),
    ]);

    kRegisterIjxUtils.email(new MockTestEmailProviderContext());

    const waitlistedUserIds = extractResourceIdList(waitlistedUsers);
    const result = await upgradeWaitlistedUsers(
      RequestData.fromExpressRequest<UpgradeWaitlistedUsersEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {userIds: waitlistedUserIds}
      )
    );
    assertEndpointResultOk(result);

    const users = await kIjxSemantic.user().getManyByQuery({
      resourceId: {$in: waitlistedUserIds},
      isOnWaitlist: false,
    });
    const usersMap = indexArray(users, {path: 'resourceId'});
    expect(users).toHaveLength(waitlistedUsers.length);

    await kIjxUtils.promises().flush();
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
        const dbJob = await kIjxSemantic.job().getOneByQuery(query);
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
