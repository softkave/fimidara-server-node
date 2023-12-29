import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kAppResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deleteWorkspace from './handler';

/**
 * TODO:
 * - Confirm that workspace artifacts are deleted
 */

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('workspace deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);

  const result = await deleteWorkspace(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
      workspaceId: workspace.resourceId,
    })
  );
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = await kSemanticModels.job().getOneByQuery<Job<DeleteResourceJobParams>>({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {$objMatch: {type: kAppResourceType.Workspace}},
  });
  expect(job).toBeTruthy();
  expect(job?.params.args).toMatchObject({
    resourceId: workspace.resourceId,
    workspaceId: workspace.resourceId,
  });
});
