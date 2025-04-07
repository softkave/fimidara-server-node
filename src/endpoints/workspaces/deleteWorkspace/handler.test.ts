import {afterAll, beforeAll, expect, test} from 'vitest';
import {kIjxSemantic} from '../../../contexts/ijx/injectables.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import RequestData from '../../RequestData.js';
import {completeTests} from '../../testHelpers/helpers/testFns.js';
import {
  assertEndpointResultOk,
  initTests,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testHelpers/utils.js';
import deleteWorkspace from './handler.js';

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
    RequestData.fromExpressRequest(
      mockExpressRequestWithAgentToken(userToken),
      {
        workspaceId: workspace.resourceId,
      }
    )
  );
  assertEndpointResultOk(result);

  appAssert(result.jobId);
  const job = (await kIjxSemantic.job().getOneByQuery({
    type: kJobType.deleteResource,
    resourceId: result.jobId,
    params: {$objMatch: {type: kFimidaraResourceType.Workspace}},
  })) as Job<DeleteResourceJobParams>;
  expect(job).toBeTruthy();
  expect(job?.params).toMatchObject({
    resourceId: workspace.resourceId,
    workspaceId: workspace.resourceId,
  });

  const dbItem = await kIjxSemantic
    .workspace()
    .getOneByQuery({resourceId: workspace.resourceId, isDeleted: true});
  expect(dbItem).toBeTruthy();
});
