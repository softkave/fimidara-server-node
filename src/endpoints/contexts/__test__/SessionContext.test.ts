import {kAppResourceType, kTokenAccessScope} from '../../../definitions/system';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generate/agentToken';
import {generateAndInsertUserListForTest} from '../../testUtils/generate/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/test';
import {initTests} from '../../testUtils/testUtils';
import {ChangePasswordError, PermissionDeniedError} from '../../users/errors';
import {kUtilsInjectables} from '../injection/injectables';

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
      scope: [kTokenAccessScope.ChangePassword],
      workspaceId: null,
      forEntityId: user.resourceId,
      entityType: kAppResourceType.User,
    });
    await expectErrorThrown(async () => {
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgent(reqData, [kAppResourceType.User], [kTokenAccessScope.Login]);
    }, [PermissionDeniedError.name]);
  });

  test('getAgent fails if user requires password change', async () => {
    const [user] = await generateAndInsertUserListForTest(1, () => ({
      requiresPasswordChange: true,
    }));
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(1, {
      scope: [kTokenAccessScope.Login],
      workspaceId: null,
      forEntityId: user.resourceId,
      entityType: kAppResourceType.User,
    });
    await expectErrorThrown(async () => {
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgent(reqData, [kAppResourceType.User], [kTokenAccessScope.Login]);
    }, [ChangePasswordError.name]);
  });
});
