import {getResourceAssignedItems} from '../../assignedItems/getAssignedItems';
import {NotFoundError} from '../../errors';
import {executeJob, waitForJob} from '../../jobs/runner';
import RequestData from '../../RequestData';
import {expectErrorThrown} from '../../testUtils/helpers/error';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
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

beforeAll(async () => {
  await initTest();
});

afterAll(async () => {
  await completeTests();
});

describe('removeCollaborator', () => {
  test('collaborator removed', async () => {
    const {userToken, user} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const instData = RequestData.fromExpressRequest<RemoveCollaboratorEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, collaboratorId: user.resourceId}
    );

    const result = await removeCollaborator(instData);
    assertEndpointResultOk(result);

    if (result.jobId) {
      await executeJob(result.jobId);
      await waitForJob(result.jobId);
    }

    const assignedItems = await getResourceAssignedItems(
      workspace.resourceId,
      user.resourceId
    );
    expect(assignedItems.findIndex(item => item.assigneeId === user.resourceId)).toBe(-1);

    await expectErrorThrown(async () => {
      await getCollaborator(instData);
    }, [NotFoundError.name]);
    await expectErrorThrown(async () => {
      await getWorkspace(
        RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
          workspaceId: workspace.resourceId,
        })
      );
    }, [PermissionDeniedError.name]);
  });
});
