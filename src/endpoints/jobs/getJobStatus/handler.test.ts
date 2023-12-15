import assert from 'assert';
import {JobStatusMap} from '../../../definitions/job';
import RequestData from '../../RequestData';
import deletePermissionGroup from '../../permissionGroups/deletePermissionGroup/handler';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {executeJob, waitForJob} from '../runner';
import getJobStatus from './handler';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('getOpStatus', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {permissionGroup} = await insertPermissionGroupForTest(
    userToken,
    workspace.resourceId
  );
  const {jobId} = await deletePermissionGroup(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
      permissionGroupId: permissionGroup.resourceId,
      workspaceId: workspace.resourceId,
    })
  );

  assert(jobId);
  await executeJob(jobId);
  await waitForJob(jobId);

  const result = await getJobStatus(
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
      jobId,
    })
  );
  assertEndpointResultOk(result);
  expect(result.status).toBe(JobStatusMap.completed);
});
