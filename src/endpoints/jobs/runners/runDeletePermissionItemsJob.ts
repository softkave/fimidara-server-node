import {isUndefined} from 'lodash';
import {AppShardId} from '../../../definitions/app';
import {DeleteResourceJobParams, Job, kJobType} from '../../../definitions/job';
import {
  PermissionItem,
  kFimidaraPermissionActionsMap,
} from '../../../definitions/permissionItem';
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
import {kSemanticModels, kUtilsInjectables} from '../../contexts/injection/injectables';
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
        type: kJobType.deleteResource,
        idempotencyToken: Date.now().toString(),
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
  const item: DeletePermissionItemInput = job.params;

  appAssert(workspaceId, 'workspaceId not present in job');
  appAssert(job.createdBy, 'agent not present in job');

  const [workspace, agent] = await Promise.all([
    kSemanticModels.workspace().getOneById(workspaceId),
    kUtilsInjectables.session().getAgentByAgentTokenId(job.createdBy.agentTokenId),
  ]);
  appAssert(workspace, 'workspace not found');

  const targets = await getPermissionItemTargets(
    agent,
    workspace,
    item.target || [],
    kFimidaraPermissionActionsMap.updatePermission
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
