import {runDeleteResourceJob} from '..';
import {DeleteResourceJobParams, Job, kJobType} from '../../../../../definitions/job';
import {kAppResourceType} from '../../../../../definitions/system';
import {extractResourceIdList} from '../../../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../../../utils/resource';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables';
import {generateAndInsertAssignedItemListForTest} from '../../../../testUtils/generate/permissionGroup';
import {generateAndInsertPermissionItemListForTest} from '../../../../testUtils/generate/permissionItem';
import {generateAndInsertTagListForTest} from '../../../../testUtils/generate/tag';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {queueJobs} from '../../../utils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runDeleteResourceJob, tag', () => {
  test('deletes', async () => {
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const shard = getNewId();
    const [mainResource] = await generateAndInsertTagListForTest(1, {
      workspaceId,
    });
    const [
      pItemsAsEntityList,
      pItemsAsTargetList,
      aItemAsAssignedList,
      aItemsAsAssigneeList,
    ] = await Promise.all([
      generateAndInsertPermissionItemListForTest(2, {
        workspaceId,
        entityId: mainResource.resourceId,
      }),
      generateAndInsertPermissionItemListForTest(2, {
        workspaceId,
        targetId: mainResource.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(2, {
        workspaceId,
        assignedItemId: mainResource.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(2, {
        workspaceId,
        assigneeId: mainResource.resourceId,
      }),
    ]);
    const [job] = await queueJobs<DeleteResourceJobParams>(
      workspaceId,
      /** parent job ID */ undefined,
      [
        {
          shard,
          type: kJobType.deleteResource,
          params: {
            workspaceId,
            type: kAppResourceType.Tag,
            resourceId: mainResource.resourceId,
          },
        },
      ]
    );

    await runDeleteResourceJob(job);
    await kUtilsInjectables.promises().flush();

    const [mainResourceExists, assignedItemsCount, childrenJobs] = await Promise.all([
      kSemanticModels.tag().existsByQuery({resourceId: mainResource.resourceId}),
      kSemanticModels.assignedItem().countByQuery({
        resourceId: {
          $in: extractResourceIdList(aItemAsAssignedList.concat(aItemsAsAssigneeList)),
        },
      }),
      kSemanticModels.job().getManyByQuery<Job<DeleteResourceJobParams>>({
        shard,
        params: {
          $objMatch: {
            resourceId: {
              $in: ([] as string[]).concat(
                extractResourceIdList(pItemsAsEntityList),
                extractResourceIdList(pItemsAsTargetList)
              ),
            },
          },
        },
      }),
    ]);

    expect(mainResourceExists).toBeFalsy();
    expect(assignedItemsCount).toBe(0);
    expect(childrenJobs.length).toBe(
      pItemsAsEntityList.length + pItemsAsTargetList.length
    );
  });
});
