import {flatten} from 'lodash-es';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';
import {DataQuery} from '../../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../../contexts/ijx/injectables.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../../definitions/job.js';
import {kFimidaraPermissionActions} from '../../../../definitions/permissionItem.js';
import {kFimidaraResourceType} from '../../../../definitions/system.js';
import {kSystemSessionAgent} from '../../../../utils/agent.js';
import {extractResourceIdList} from '../../../../utils/fns.js';
import {getNewId} from '../../../../utils/resource.js';
import {DeletePermissionItemInput} from '../../../permissionItems/deleteItems/types.js';
import {generateAndInsertTestFiles} from '../../../testHelpers/generate/file.js';
import {generateAndInsertTestFolders} from '../../../testHelpers/generate/folder.js';
import {generateAndInsertPermissionGroupListForTest} from '../../../testHelpers/generate/permissionGroup.js';
import {generateAndInsertPermissionItemListForTest} from '../../../testHelpers/generate/permissionItem.js';
import {generateAndInsertWorkspaceListForTest} from '../../../testHelpers/generate/workspace.js';
import {completeTests} from '../../../testHelpers/helpers/testFns.js';
import {initTests} from '../../../testHelpers/utils.js';
import {queueJobs} from '../../queueJobs.js';
import {runDeletePermissionItemsJob} from '../runDeletePermissionItemsJob.js';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runDeletePermissionItemsJob', () => {
  test('creates delete resource jobs', async () => {
    const access = true;
    const action = kFimidaraPermissionActions.wildcard;
    const [workspace] = await generateAndInsertWorkspaceListForTest(1);
    const [pgL, [f01], [folder01]] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(2, {
        workspaceId: workspace.resourceId,
      }),
      generateAndInsertTestFiles(1, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
      generateAndInsertTestFolders(1, {
        workspaceId: workspace.resourceId,
        parentId: null,
      }),
    ]);
    const pgItems = flatten(
      await Promise.all(
        pgL.map(async pg => {
          return flatten(
            await Promise.all([
              generateAndInsertPermissionItemListForTest(2, {
                access,
                action,
                workspaceId: workspace.resourceId,
                entityId: pg.resourceId,
                targetId: f01.resourceId,
              }),
              generateAndInsertPermissionItemListForTest(2, {
                access,
                action,
                workspaceId: workspace.resourceId,
                entityId: pg.resourceId,
                targetId: folder01.resourceId,
              }),
            ])
          );
        })
      )
    );
    const shard = getNewId();
    const [job] = await queueJobs<DeletePermissionItemInput>(
      workspace.resourceId,
      /** parent job ID */ undefined,
      [
        {
          shard,
          createdBy: kSystemSessionAgent,
          type: kJobType.deletePermissionItem,
          params: {entityId: extractResourceIdList(pgL)},
          idempotencyToken: Date.now().toString(),
        },
      ]
    );

    await runDeletePermissionItemsJob(job);
    await kIjxUtils.promises().flush();

    const itemIds = extractResourceIdList(pgItems);
    const query: DataQuery<Job<DeleteResourceJobParams>> = {
      shard,
      workspaceId: workspace.resourceId,
      type: kJobType.deleteResource,
      createdBy: {
        $objMatch: {
          agentId: kSystemSessionAgent.agentId,
          agentType: kSystemSessionAgent.agentType,
        },
      },
      params: {
        $objMatch: {
          resourceId: {$in: itemIds},
          type: kFimidaraResourceType.PermissionItem,
          workspaceId: workspace.resourceId,
        },
      },
    };
    const [deleteResourceJobs, dbItems] = await Promise.all([
      kIjxSemantic.job().getManyByQuery(query),
      kIjxSemantic
        .permissionItem()
        .getManyByQuery({resourceId: {$in: itemIds}, isDeleted: true}),
    ]);

    expect(deleteResourceJobs).toHaveLength(itemIds.length);
    expect(dbItems).toHaveLength(itemIds.length);
  });
});
