import {kFimidaraResourceType, kTokenAccessScope} from '../../../definitions/system';
import {makeUserSessionAgent} from '../../../utils/sessionUtils';
import RequestData from '../../RequestData';
import {generateAndInsertAgentTokenListForTest} from '../../testUtils/generate/agentToken';
import {generateAndInsertUserListForTest} from '../../testUtils/generate/user';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/testFns';
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
      scope: [kTokenAccessScope.changePassword],
      workspaceId: null,
      forEntityId: user.resourceId,
      entityType: kFimidaraResourceType.User,
    });
    await expectErrorThrown(async () => {
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgentFromReq(
          reqData,
          [kFimidaraResourceType.User],
          [kTokenAccessScope.login]
        );
    }, [PermissionDeniedError.name]);
  });

  test('getAgent fails if user requires password change', async () => {
    const [user] = await generateAndInsertUserListForTest(1, () => ({
      requiresPasswordChange: true,
    }));
    const [userAgentToken] = await generateAndInsertAgentTokenListForTest(1, {
      scope: [kTokenAccessScope.login],
      workspaceId: null,
      forEntityId: user.resourceId,
      entityType: kFimidaraResourceType.User,
    });
    await expectErrorThrown(async () => {
      const reqData = new RequestData({
        agent: makeUserSessionAgent(user, userAgentToken),
      });
      await kUtilsInjectables
        .session()
        .getAgentFromReq(
          reqData,
          [kFimidaraResourceType.User],
          [kTokenAccessScope.login]
        );
    }, [ChangePasswordError.name]);
  });
});
