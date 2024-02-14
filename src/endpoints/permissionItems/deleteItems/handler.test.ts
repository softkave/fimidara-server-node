import {keyBy} from 'lodash';
import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {kPermissionsMap} from '../../../definitions/permissionItem';
import {kAppResourceType} from '../../../definitions/system';
import {extractResourceIdList} from '../../../utils/fns';
import RequestData from '../../RequestData';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {generateAndInsertPermissionItemListForTest} from '../../testUtils/generate/permissionItem';
import {completeTests} from '../../testUtils/helpers/testFns';
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
  const [{permissionGroup: pg01}, {permissionGroup: pg02}] = await Promise.all([
    insertPermissionGroupForTest(userToken, workspace.resourceId),
    insertPermissionGroupForTest(userToken, workspace.resourceId),
  ]);
  const [items01, items02] = await Promise.all([
    generateAndInsertPermissionItemListForTest(10, {
      workspaceId: workspace.resourceId,
      action: kPermissionsMap.addTag,
      targetId: workspace.resourceId,
      entityId: pg01.resourceId,
    }),
    generateAndInsertPermissionItemListForTest(10, {
      workspaceId: workspace.resourceId,
      action: kPermissionsMap.addTag,
      targetId: workspace.resourceId,
      entityId: pg02.resourceId,
    }),
  ]);
  const items = items01.concat(items02);

  const instData = RequestData.fromExpressRequest<DeletePermissionItemsEndpointParams>(
    mockExpressRequestWithAgentToken(userToken),
    {
      workspaceId: workspace.resourceId,
      items: [
        {
          action: kPermissionsMap.addTag,
          target: {targetId: workspace.resourceId},
          entityId: pg01.resourceId,
        },
        {entityId: pg02.resourceId},
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
    type: kJobType.deleteResource0,
    resourceId: {$in: jobIds},
  })) as Job<DeleteResourceJobParams>[];
  const jobsById = keyBy(jobs, job => job.resourceId);
  jobIds.forEach(id => {
    const resultJob = resultJobsById[id];
    const job = jobsById[id];
    expect(job).toBeTruthy();
    const params: DeleteResourceJobParams = {
      type: kAppResourceType.PermissionItem,
      resourceId: resultJob.resourceId,
      workspaceId: workspace.resourceId,
    };
    expect(job.params).toMatchObject(params);
  });

  const dbItems = await kSemanticModels
    .permissionItem()
    .getOneByQuery({resourceId: {$in: itemIds}, isDeleted: true});
  expect(dbItems).toHaveLength(itemIds.length);
});
