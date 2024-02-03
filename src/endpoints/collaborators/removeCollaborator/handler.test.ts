import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
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
 * - Check that artifacts are removed
 * -  Test that user agent token
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
    const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
      type: kJobType.deleteResource,
      resourceId: result.jobId,
      params: {$objMatch: {type: kAppResourceType.User, isRemoveCollaborator: true}},
    });
    expect(job).toBeTruthy();
    expect(job?.params.args).toMatchObject({
      resourceId: user.resourceId,
      workspaceId: workspace.resourceId,
    });

    // TODO: test user does not have access to workspace when job is done
  });
});
