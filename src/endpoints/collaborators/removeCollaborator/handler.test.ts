import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {kSemanticModels} from '../../../contexts/injection/injectables.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testUtils/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils.js';
import removeCollaborator from './handler.js';
import {RemoveCollaboratorEndpointParams} from './types.js';

/**
 * TODO:
 * - test user does not have access to workspace when job is done
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('removeCollaborator', () => {
  test('collaborator removed', async () => {
    const {userToken, user} = await insertUserForTest();
    const {workspace} = await insertWorkspaceForTest(userToken);
    const reqData =
      RequestData.fromExpressRequest<RemoveCollaboratorEndpointParams>(
        mockExpressRequestWithAgentToken(userToken),
        {workspaceId: workspace.resourceId, collaboratorId: user.resourceId}
      );

    const result = await removeCollaborator(reqData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kSemanticModels.job().getOneByQuery({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {
        $objMatch: {
          type: kFimidaraResourceType.User,
          isRemoveCollaborator: true,
        },
      },
    })) as Job<DeleteResourceJobParams>;
    expect(job).toBeTruthy();
    expect(job?.params).toMatchObject({
      resourceId: user.resourceId,
      workspaceId: workspace.resourceId,
    });

    const dbItem = await kSemanticModels.assignedItem().getOneByQuery({
      assignedItemId: workspace.resourceId,
      assigneeId: user.resourceId,
      isDeleted: true,
    });
    expect(dbItem).toBeTruthy();
  });
});
