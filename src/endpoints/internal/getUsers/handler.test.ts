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
import getUsers from './handler';
import {GetUsersEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getUsers', () => {
  test('returns users', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const [users] = await Promise.all([
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

    const result = await getUsers(
      context,
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
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    await expectErrorThrown(() => {
      assertContext(context);
      return getUsers(
        context,
        RequestData.fromExpressRequest<GetUsersEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
