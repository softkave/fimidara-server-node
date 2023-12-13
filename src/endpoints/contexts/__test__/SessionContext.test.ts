import {AppResourceTypeMap, TokenAccessScopeMap} from '../../../definitions/system';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generateData/agentToken';
import {generateAndInsertUserListForTest} from '../../testUtils/generateData/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/test';
import {initTests} from '../../testUtils/testUtils';
import {ChangePasswordError, PermissionDeniedError} from '../../users/errors';
import {kUtilsInjectables} from '../injectables';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('SessionContext', () => {
  test('getAgent fails if token does not contain scope', async () => {
    const [user] = await generateAndInsertUserListForTest(1);
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(1, {
      scope: [TokenAccessScopeMap.ChangePassword],
      workspaceId: null,
      separateEntityId: user.resourceId,
      agentType: AppResourceTypeMap.User,
    });
    await expectErrorThrown(async () => {
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgent(reqData, [AppResourceTypeMap.User], [TokenAccessScopeMap.Login]);
    }, [PermissionDeniedError.name]);
  });

  test('getAgent fails if user requires password change', async () => {
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
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgent(reqData, [AppResourceTypeMap.User], [TokenAccessScopeMap.Login]);
    }, [ChangePasswordError.name]);
  });
});
