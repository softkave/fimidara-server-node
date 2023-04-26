import assert from 'assert';
import {AppResourceType, TokenAccessScope} from '../../../definitions/system';
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
      scope: [TokenAccessScope.ChangePassword],
      workspaceId: null,
      separateEntityId: user.resourceId,
      agentType: AppResourceType.User,
    });
    await expectErrorThrown(async () => {
      assert(context);
      const reqData = new RequestData({agent: makeUserSessionAgent(user, userAgentToken)});
      await context.session.getAgent(
        context,
        reqData,
        [AppResourceType.User],
        [TokenAccessScope.Login]
      );
    }, [PermissionDeniedError.name]);
  });

  test('getAgent fails if user requires password change', async () => {
    assert(context);
    const [user] = await generateAndInsertUserListForTest(context, 1, () => ({
      requiresPasswordChange: true,
    }));
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(context, 1, {
      scope: [TokenAccessScope.Login],
      workspaceId: null,
      separateEntityId: user.resourceId,
      agentType: AppResourceType.User,
    });
    await expectErrorThrown(async () => {
      assert(context);
      const reqData = new RequestData({agent: makeUserSessionAgent(user, userAgentToken)});
      await context.session.getAgent(
        context,
        reqData,
        [AppResourceType.User],
        [TokenAccessScope.Login]
      );
    }, [ChangePasswordError.name]);
  });
});
