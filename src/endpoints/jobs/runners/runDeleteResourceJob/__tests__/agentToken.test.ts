import {runDeleteResourceJob} from '..';
import {DeleteResourceJobParams, Job, kJobType} from '../../../../../definitions/job';
import {kAppResourceType} from '../../../../../definitions/system';
import {extractResourceIdList} from '../../../../../utils/fns';
import {getNewId, getNewIdForResource} from '../../../../../utils/resource';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../../contexts/injection/injectables';
import {generateAndInsertAgentTokenListForTest} from '../../../../testUtils/generate/agentToken';
import {generateAndInsertTestFilePresignedPathList} from '../../../../testUtils/generate/file';
import {generateAndInsertAssignedItemListForTest} from '../../../../testUtils/generate/permissionGroup';
import {generateAndInsertPermissionItemListForTest} from '../../../../testUtils/generate/permissionItem';
import {completeTests} from '../../../../testUtils/helpers/testFns';
import {initTests} from '../../../../testUtils/testUtils';
import {queueJobs} from '../../../utils';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runDeleteResourceJob, agent token', () => {
  test('deletes', async () => {
    const workspaceId = getNewIdForResource(kAppResourceType.Workspace);
    const shard = getNewId();
    const [agentToken] = await generateAndInsertAgentTokenListForTest(1, {workspaceId});
    const [
      presignedPathList,
      pItemsAsEntityList,
      pItemsAsTargetList,
      aItemAsAssignedList,
      aItemsAsAssigneeList,
    ] = await Promise.all([
      generateAndInsertTestFilePresignedPathList(2, {
        workspaceId,
        issuerAgentTokenId: agentToken.resourceId,
      }),
      generateAndInsertPermissionItemListForTest(2, {
        workspaceId,
        entityId: agentToken.resourceId,
      }),
      generateAndInsertPermissionItemListForTest(2, {
        workspaceId,
        targetId: agentToken.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(2, {
        workspaceId,
        assignedItemId: agentToken.resourceId,
      }),
      generateAndInsertAssignedItemListForTest(2, {
        workspaceId,
        assigneeId: agentToken.resourceId,
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
            type: kAppResourceType.AgentToken,
            resourceId: agentToken.resourceId,
          },
        },
      ]
    );

    await runDeleteResourceJob(job);
    await kUtilsInjectables.promises().flush();

    const [agentTokenExists, assignedItemsCount, childrenJobs] = await Promise.all([
      kSemanticModels.agentToken().existsByQuery({resourceId: agentToken.resourceId}),
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
              $in: extractResourceIdList(presignedPathList).concat(
                extractResourceIdList(pItemsAsEntityList),
                extractResourceIdList(pItemsAsTargetList)
              ),
            },
          },
        },
      }),
    ]);

    expect(agentTokenExists).toBeFalsy();
    expect(assignedItemsCount).toBe(0);
    expect(childrenJobs.length).toBe(
      presignedPathList.length + pItemsAsEntityList.length + pItemsAsTargetList.length
    );
  });
});
