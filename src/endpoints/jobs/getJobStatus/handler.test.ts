import {JobStatus} from '../../../definitions/job';
import {BaseContextType} from '../../contexts/types';
import deletePermissionGroup from '../../permissionGroups/deletePermissionGroup/handler';
import RequestData from '../../RequestData';
import {completeTest} from '../../testUtils/helpers/test';
import {
  assertContext,
  assertEndpointResultOk,
  initTestBaseContext,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import {executeJob, waitForJob} from '../runner';
import getJobStatus from './handler';

let context: BaseContextType | null = null;

beforeAll(async () => {
  context = await initTestBaseContext();
});

afterAll(async () => {
  await completeTest({context});
});

test('getOpStatus', async () => {
  assertContext(context);
  const {userToken} = await insertUserForTest(context);
  const {workspace} = await insertWorkspaceForTest(context, userToken);
  const {permissionGroup} = await insertPermissionGroupForTest(
    context,
    userToken,
    workspace.resourceId
  );
  const {jobId} = await deletePermissionGroup(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
      permissionGroupId: permissionGroup.resourceId,
      workspaceId: workspace.resourceId,
    })
  );
  await executeJob(context, jobId);
  await waitForJob(context, jobId);

  const result = await getJobStatus(
    context,
    RequestData.fromExpressRequest(mockExpressRequestWithAgentToken(userToken), {
      jobId,
    })
  );
  assertEndpointResultOk(result);
  expect(result.status).toBe(JobStatus.Completed);
});
