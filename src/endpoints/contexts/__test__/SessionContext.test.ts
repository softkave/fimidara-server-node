import assert from 'assert';
import {AppResourceTypeMap, TokenAccessScopeMap} from '../../../definitions/system';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generateData/agentToken';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {initTest} from '../../testUtils/testUtils';
import {ChangePasswordError, PermissionDeniedError} from '../../users/errors';

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTest();
});

describe('SessionContext', () => {
  test('getAgent fails if token does not contain scope', async () => {
    assert();
    const [user] = await generateAndInsertUserListForTest(1);
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(1, {
      scope: [TokenAccessScopeMap.ChangePassword],
      workspaceId: null,
      separateEntityId: user.resourceId,
      agentType: AppResourceTypeMap.User,
    });
    await expectErrorThrown(async () => {
      assert();
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgent(reqData, [AppResourceTypeMap.User], [TokenAccessScopeMap.Login]);
    }, [PermissionDeniedError.name]);
  });

  test('getAgent fails if user requires password change', async () => {
    assert();
    const [user] = await generateAndInsertUserListForTest(1, () => ({
      requiresPasswordChange: true,
    }));
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(1, {
      scope: [TokenAccessScopeMap.Login],
      workspaceId: null,
      separateEntityId: user.resourceId,
      agentType: AppResourceTypeMap.User,
    });
    await expectErrorThrown(async () => {
      assert();
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgent(reqData, [AppResourceTypeMap.User], [TokenAccessScopeMap.Login]);
    }, [ChangePasswordError.name]);
  });
});
