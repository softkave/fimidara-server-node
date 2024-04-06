import {isUndefined} from 'lodash';
import {AppShardId} from '../../../definitions/app';
import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {PermissionItem, kPermissionsMap} from '../../../definitions/permissionItem';
import {Agent, kFimidaraResourceType} from '../../../definitions/system';
import {appAssert} from '../../../utils/assertion';
import {getTimestamp} from '../../../utils/dateFns';
import {
  convertToArray,
  extractResourceIdList,
  isObjectFieldsEmpty,
} from '../../../utils/fns';
import {
  PaginatedFetchGetFn,
  PaginatedFetchProcessFn,
  paginatedFetch,
} from '../../../utils/paginatedFetch';
import {DataQuery, kIncludeInProjection} from '../../contexts/data/types';
import {kSemanticModels} from '../../contexts/injection/injectables';
import {DeletePermissionItemInput} from '../../permissionItems/deleteItems/types';
import {
  PermissionItemTargets,
  getPermissionItemTargets,
} from '../../permissionItems/getPermissionItemTargets';
import {queueJobs} from '../queueJobs';

type PartialPermissionItem = Pick<PermissionItem, 'resourceId'>;
type FetchArgs = {
  query: DataQuery<PermissionItem>;
  workspaceId: string;
  agent: Agent;
  jobId: string;
  shard: AppShardId;
};
type FetchResult = PartialPermissionItem[];

function deletePermissionItemInputToQuery(
  workspaceId: string,
  item: DeletePermissionItemInput,
  targets: PermissionItemTargets
) {
  const query: DataQuery<PermissionItem> = {};

  if (item.target) {
    const {targetList} = targets.getByTarget(item.target || []);
    const idList = extractResourceIdList(targetList);

    if (idList.length) {
      query.targetId = {$in: idList};
    }
  }

  if (!isUndefined(item.access)) {
    query.access = item.access;
  }

  if (item.action) {
    const actions = convertToArray(item.action);
    // @ts-ignore
    query.action = {$in: actions};
  }

  if (item.entityId) {
    query.entityId = {$in: convertToArray(item.entityId)};
  }

  if (isObjectFieldsEmpty(query)) {
    return undefined;
  }

  query.workspaceId = workspaceId;
  return query;
}

const getPermissionItemsByQuery: PaginatedFetchGetFn<
  FetchArgs,
  FetchResult
> = async props => {
  const {args, page, pageSize} = props;
  return await kSemanticModels.utils().withTxn(async opts => {
    const items = await kSemanticModels.permissionItem().getManyByQuery(args.query, {
      page,
      pageSize,
      projection: {resourceId: kIncludeInProjection},
      ...opts,
    });
    await kSemanticModels
      .permissionItem()
      .updateManyByQuery(
        {resourceId: {$in: extractResourceIdList(items)}},
        {isDeleted: true, deletedAt: getTimestamp(), deletedBy: args.agent},
        opts
      );

    return items;
  }, /** reuseTxn */ true);
};

const processPermissionItems: PaginatedFetchProcessFn<
  FetchArgs,
  FetchResult
> = async props => {
  const {args, data} = props;
  await queueJobs<DeleteResourceJobParams>(
    args.workspaceId,
    args.jobId,
    data.map(item => {
      return {
        shard: args.shard,
        createdBy: args.agent,
        type: kJobType.deleteResource0,
        params: {
          workspaceId: args.workspaceId,
          resourceId: item.resourceId,
          type: kFimidaraResourceType.PermissionItem,
        },
      };
    })
  );
};

export async function runDeletePermissionItemsJob(job: Job<DeletePermissionItemInput>) {
  const workspaceId = job.workspaceId;
  const agent = job.createdBy;
  const item: DeletePermissionItemInput = job.params;

  appAssert(workspaceId);
  appAssert(agent);
  const workspace = await kSemanticModels.workspace().getOneById(workspaceId);
  appAssert(workspace);

  const targets = await getPermissionItemTargets(
    agent,
    workspace,
    item.target || [],
    kPermissionsMap.updatePermission
  );

  const query = deletePermissionItemInputToQuery(workspaceId, item, targets);

  if (query) {
    await paginatedFetch<FetchArgs, FetchResult>({
      args: {workspaceId, query, agent, jobId: job.resourceId, shard: job.shard},
      getFn: getPermissionItemsByQuery,
      processFn: processPermissionItems,
    });
  }
}
