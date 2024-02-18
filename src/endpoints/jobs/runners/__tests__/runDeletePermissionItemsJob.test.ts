import {flatten} from 'lodash';
import {DeleteResourceJobParams, Job, kJobType} from '../../../../definitions/job';
import {kPermissionsMap} from '../../../../definitions/permissionItem';
import {kAppResourceType} from '../../../../definitions/system';
import {kSystemSessionAgent} from '../../../../utils/agent';
import {extractResourceIdList} from '../../../../utils/fns';
import {getNewId} from '../../../../utils/resource';
import {DataQuery} from '../../../contexts/data/types';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../../contexts/injection/injectables';
import {DeletePermissionItemInput} from '../../../permissionItems/deleteItems/types';
import {generateAndInsertTestFiles} from '../../../testUtils/generate/file';
import {generateAndInsertTestFolders} from '../../../testUtils/generate/folder';
import {generateAndInsertPermissionGroupListForTest} from '../../../testUtils/generate/permissionGroup';
import {generateAndInsertPermissionItemListForTest} from '../../../testUtils/generate/permissionItem';
import {generateAndInsertWorkspaceListForTest} from '../../../testUtils/generate/workspace';
import {completeTests} from '../../../testUtils/helpers/testFns';
import {initTests} from '../../../testUtils/testUtils';
import {queueJobs} from '../../queueJobs';
import {runDeletePermissionItemsJob} from '../runDeletePermissionItemsJob';

beforeAll(async () => {
  await initTests();
});

afterAll(async () => {
  await completeTests();
});

describe('runDeletePermissionItemsJob', () => {
  test('creates delete resource jobs', async () => {
    const access = true;
    const action = kPermissionsMap.wildcard;
    const [workspace] = await generateAndInsertWorkspaceListForTest(1);
    const [pgL, [f01], [folder01]] = await Promise.all([
      generateAndInsertPermissionGroupListForTest(2, {workspaceId: workspace.resourceId}),
      generateAndInsertTestFiles(1, {workspaceId: workspace.resourceId, parentId: null}),
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
          params: {
            entityId: extractResourceIdList(pgL),
          },
        },
      ]
    );

    await runDeletePermissionItemsJob(job);
    await kUtilsInjectables.promises().flush();

    const itemIds = extractResourceIdList(pgItems);
    const query: DataQuery<Job<DeleteResourceJobParams>> = {
      shard,
      workspaceId: workspace.resourceId,
      type: kJobType.deleteResource0,
      createdBy: {
        $objMatch: {
          agentId: kSystemSessionAgent.agentId,
          agentType: kSystemSessionAgent.agentType,
        },
      },
      params: {
        $objMatch: {
          resourceId: {$in: itemIds},
          type: kAppResourceType.PermissionItem,
          workspaceId: workspace.resourceId,
        },
      },
    };
    const [deleteResourceJobs, dbItems] = await Promise.all([
      kSemanticModels.job().getManyByQuery(query),
      kSemanticModels
        .permissionItem()
        .getManyByQuery({resourceId: {$in: itemIds}, isDeleted: true}),
    ]);

    expect(deleteResourceJobs).toHaveLength(itemIds.length);
    expect(dbItems).toHaveLength(itemIds.length);
  });
});
