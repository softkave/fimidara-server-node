import {SYSTEM_SESSION_AGENT} from '../../../utils/agent';
import {extractResourceIdList} from '../../../utils/fns';
import {assignWorkspaceToUser} from '../../assignedItems/addAssignedItems';
import {executeWithMutationRunOptions} from '../../contexts/semantic/utils';
import {BaseContextType} from '../../contexts/types';
import RequestData from '../../RequestData';
import {generateAndInsertWorkspaceListForTest} from '../../testUtils/generateData/workspace';
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
import getWorkspaces from './handler';
import {GetWorkspacesEndpointParams} from './types';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('getWorkspaces', () => {
  test('returns workspaces', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const [workspaceList] = await Promise.all([
      generateAndInsertWorkspaceListForTest(context, /** count */ 2),
      executeWithMutationRunOptions(context, opts => {
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

    const result = await getWorkspaces(
      context,
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
    assertContext(context);
    const {userToken} = await insertUserForTest(context);
    await expectErrorThrown(() => {
      assertContext(context);
      return getWorkspaces(
        context,
        RequestData.fromExpressRequest<GetWorkspacesEndpointParams>(
          mockExpressRequestWithAgentToken(userToken),
          {}
        )
      );
    }, [PermissionDeniedError.name]);
  });
});
