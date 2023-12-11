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
import getUsers from './handler';
import {GetUsersEndpointParams} from './types';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest({});
});

describe('getUsers', () => {
  test('returns users', async () => {
    const {userToken, user} = await insertUserForTest();
    const [users] = await Promise.all([
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

    const result = await getUsers(
      RequestData.fromExpressRequest<GetUsersEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {}
      )
    );
    assertEndpointResultOk(result);
    const userIdList = extractResourceIdList(users);
    const resultUserIdList = extractResourceIdList(result.users);
    expect(resultUserIdList).toEqual(expect.arrayContaining(userIdList));
  });

  test('fails if user not part of root workspace', async () => {
    const {userToken} = await insertUserForTest();
    await expectErrorThrown(() => {
      return getUsers(
        RequestData.fromExpressRequest<GetUsersEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
