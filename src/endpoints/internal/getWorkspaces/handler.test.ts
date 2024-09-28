import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables.js';
import {kSystemSessionAgent} from '../../../utils/agent.js';
import {extractResourceIdList} from '../../../utils/fns.js';
import RequestData from '../../RequestData.js';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems.js';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generate/workspace.js';
import {expectErrorThrown} from '../../testUtils/helpers/error.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import {PermissionDeniedError} from '../../users/errors.js';
import getWorkspaces from './handler.js';
import {GetWorkspacesEndpointParams} from './types.js';

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
      }),
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
    expect(resultWorkspaceIdList).toEqual(
      expect.arrayContaining(workspaceIdList)
    );
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
