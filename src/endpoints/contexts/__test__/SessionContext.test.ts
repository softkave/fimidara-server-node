import assert from 'assert';
import {AppResourceTypeMap, TokenAccessScopeMap} from '../../../definitions/system';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generateData/agentToken';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {initTestBaseContext} from '../../testUtils/testUtils';
import {ChangePasswordError, PermissionDeniedError} from '../../users/errors';
import {BaseContextType} from '../types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('SessionContext', () => {
  test('getAgent fails if token does not contain scope', async () => {
    assert(context);
    const [user] = await generateAndInsertUserListForTest(context, 1);
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(context, 1, {
      scope: [TokenAccessScopeMap.ChangePassword],
      workspaceId: null,
      separateEntityId: user.resourceId,
      agentType: AppResourceTypeMap.User,
    });
    await expectErrorThrown(async () => {
      assert(context);
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await context.session.getAgent(
        context,
        reqData,
        [AppResourceTypeMap.User],
        [TokenAccessScopeMap.Login]
      );
    }, [PermissionDeniedError.name]);
  });

  test('getAgent fails if user requires password change', async () => {
    assert(context);
    const [user] = await generateAndInsertUserListForTest(context, 1, () => ({
      requiresPasswordChange: true,
    }));
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(context, 1, {
      scope: [TokenAccessScopeMap.Login],
      workspaceId: null,
      separateEntityId: user.resourceId,
      agentType: AppResourceTypeMap.User,
    });
    await expectErrorThrown(async () => {
      assert(context);
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await context.session.getAgent(
        context,
        reqData,
        [AppResourceTypeMap.User],
        [TokenAccessScopeMap.Login]
      );
    }, [ChangePasswordError.name]);
  });
});
