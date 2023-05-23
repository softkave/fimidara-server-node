import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {BaseContextType} from '../../contexts/types';
import {NotFoundError} from '../../errors';
import {executeJob, waitForJob} from '../../jobs/runner';
import RequestData from '../../RequestData';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {PermissionDeniedError} from '../../users/errors';
import getWorkspace from '../../workspaces/getWorkspace/handler';
import getCollaborator from '../getCollaborator/handler';
import removeCollaborator from './handler';
import {RemoveCollaboratorEndpointParams} from './types';

/**
 * TODO:
 * - Check that artifacts are removed
 * -  Test that user agent token
 */

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

describe('removeCollaborator', () => {
  test('collaborator removed', async () => {
    assertContext(context);
    const {userToken, user} = await insertUserForTest(context);
    const {workspace} = await insertWorkspaceForTest(context, userToken);
    const instData = RequestData.fromExpressRequest<RemoveCollaboratorEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, collaboratorId: user.resourceId}
    );

    const result = await removeCollaborator(context, instData);
    assertEndpointResultOk(result);
    await executeJob(context, result.jobId);
    await waitForJob(context, result.jobId);

    const assignedItems = await getResourceAssignedItems(
      context,
      workspace.resourceId,
      user.resourceId
    );
    expect(assignedItems.findIndex(item => item.assigneeId === user.resourceId)).toBe(-1);

    await expectErrorThrown(async () => {
      assertContext(context);
      await getCollaborator(context, instData);
    }, [NotFoundError.name]);
    await expectErrorThrown(async () => {
      assertContext(context);
      await getWorkspace(
        context,
        RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
          workspaceId: workspace.resourceId,
        })
      );
    }, [PermissionDeniedError.name]);
  });
});
