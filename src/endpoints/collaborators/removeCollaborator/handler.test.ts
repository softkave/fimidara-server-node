import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kFimidaraResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {completeTests} from '../../testUtils/helpers/testFns';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import removeCollaborator from './handler';
import {RemoveCollaboratorEndpointParams} from './types';

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
    const instData = RequestData.fromExpressRequest<RemoveCollaboratorEndpointParams>(
      mockExpressRequestWithAgentToken(userToken),
      {workspaceId: workspace.resourceId, collaboratorId: user.resourceId}
    );

    const result = await removeCollaborator(instData);
    assertEndpointResultOk(result);

    appAssert(result.jobId);
    const job = (await kSemanticModels.job().getOneByQuery({
      type: kJobType.deleteResource0,
      resourceId: result.jobId,
      params: {$objMatch: {type: kFimidaraResourceType.User, isRemoveCollaborator: true}},
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
