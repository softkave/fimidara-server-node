import {kSystemSessionAgent} from '../../../utils/agent';
import {extractResourceIdList} from '../../../utils/fns';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
import RequestData from '../../RequestData';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generate/workspace';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import getWorkspaces from './handler';
import {GetWorkspacesEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('getWorkspaces', () => {
  test('returns workspaces', async () => {
    const {userToken, user} = await insertUserForTest();
    const [workspaceList] = await Promise.all([
      generateAndInsertWorkspaceListForTest(/** count */ 2),
      kSemanticModels.utils().withTxn(opts => {
        return assignWorkspaceToUser(
          kSystemSessionAgent,
          kUtilsInjectables.runtimeConfig().appWorkspaceId,
          user.resourceId,
          opts
        );
      }, /** reuseTxn */ true),
    ]);

    const result = await getWorkspaces(
      RequestData.fromExpressRequest<GetWorkspacesEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {}
      )
    );
    assertEndpointResultOk(result);
    const workspaceIdList = extractResourceIdList(workspaceList);
    const resultWorkspaceIdList = extractResourceIdList(result.workspaceList);
    expect(resultWorkspaceIdList).toEqual(expect.arrayContaining(workspaceIdList));
  });

  test('fails if user not part of root workspace', async () => {
    const {userToken} = await insertUserForTest();
    await expectErrorThrown(() => {
      return getWorkspaces(
        RequestData.fromExpressRequest<GetWorkspacesEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
