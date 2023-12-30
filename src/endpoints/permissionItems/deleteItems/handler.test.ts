import {keyBy} from 'lodash';
import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import {kAppResourceType} from '../../../definitions/system';
import {extractResourceIdList} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injectables';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generate/permissionItem';
import {completeTests} from '../../testUtils/helpers/test';
import {
  assertEndpointResultOk,
  initTests,
  insertPermissionGroupForTest,
  insertUserForTest,
  insertWorkspaceForTest,
  mockExpressRequestWithAgentToken,
} from '../../testUtils/testUtils';
import deletePermissionItems from './handler';
import {DeletePermissionItemsEndpointParams} from './types';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

test('permission items deleted', async () => {
  const {userToken} = await insertUserForTest();
  const {workspace} = await insertWorkspaceForTest(userToken);
  const {permissionGroup} = await insertPermissionGroupForTest(
    userToken,
    workspace.resourceId
  );
  const items = await generateAndInsertPermissionItemListForTest(10, {
    workspaceId: workspace.resourceId,
    action: kPermissionsMap.readFile,
    targetId: workspace.resourceId,
    entityId: permissionGroup.resourceId,
  });

  const instData = RequestData.fromExpressRequest<DeletePermissionItemsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId: workspace.resourceId,
      items: [
        {action: kPermissionsMap.readFile, target: {targetId: workspace.resourceId}},
      ],
    }
  );
  const result = await deletePermissionItems(instData);
  assertEndpointResultOk(result);

  const itemIds = extractResourceIdList(items);
  const jobItemIds = result.jobs.map(job => job.resourceId);
  expect(itemIds).toEqual(expect.arrayContaining(jobItemIds));

  const resultJobsById = keyBy(result.jobs, job => job.jobId);
  const jobIds = Object.keys(resultJobsById);
  const jobs = (await kSemanticModels.job().getManyByQuery({
    type: kJobType.deleteResource,
    resourceId: {$in: jobIds},
  })) as Job<DeleteResourceJobParams>[];
  const jobsById = keyBy(jobs, job => job.resourceId);
  jobIds.forEach(id => {
    const resultJob = resultJobsById[id];
    const job = jobsById[id];
    expect(job).toBeTruthy();
    const params: DeleteResourceJobParams = {
      type: kAppResourceType.PermissionItem,
      args: {resourceId: resultJob.resourceId, workspaceId: workspace.resourceId},
    };
    expect(job.params).toMatchObject(params);
  });
});
