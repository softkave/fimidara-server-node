import {EmailJobParams, Job, kEmailJobType, kJobType} from '../../../definitions/job';
import {kFimidaraResourceType} from '../../../definitions/system';
import {kSystemSessionAgent} from '../../../utils/agent';
import {extractResourceIdList} from '../../../utils/fns';
import {indexArray} from '../../../utils/indexArray';
import {getNewIdForResource} from '../../../utils/resource';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {DataQuery} from '../../contexts/data/types';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import {kRegisterUtilsInjectables} from '../../contexts/injection/register';
import RequestData from '../../RequestData';
import MockTestEmailProviderContext from '../../testUtils/context/email/MockTestEmailProviderContext';
import {generateAndInsertUserListForTest} from '../../testUtils/generate/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import upgradeWaitlistedUsers from './handler';
import {UpgradeWaitlistedUsersEndpointParams} from './types';

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
          kUtilsInjectables.runtimeConfig().appWorkspaceId,
          user.resourceId,
          opts
        );
      }, /** reuseTxn */ true),
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

    await Promise.all(
      users.map(async user => {
        expect(usersMap[user.resourceId]).toBeTruthy();

        await kUtilsInjectables.promises().flush();
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
