import assert from 'assert';
import {isUndefined} from 'lodash-es';
import {DataQuery, kIncludeInProjection} from '../../../contexts/data/types.js';
import {kIjxSemantic, kIjxUtils} from '../../../contexts/ijx/injectables.js';
import {AppShardId} from '../../../definitions/app.js';
import {
  DeleteResourceJobParams,
  Job,
  kJobType,
} from '../../../definitions/job.js';
import {
  PermissionItem,
  kFimidaraPermissionActions,
} from '../../../definitions/permissionItem.js';
import {Agent, kFimidaraResourceType} from '../../../definitions/system.js';
import {appAssert} from '../../../utils/assertion.js';
import {getTimestamp} from '../../../utils/dateFns.js';
import {
  convertToArray,
  extractResourceIdList,
  isObjectFieldsEmpty,
} from '../../../utils/fns.js';
import {
  PaginatedFetchGetFn,
  PaginatedFetchProcessFn,
  paginatedFetch,
} from '../../../utils/paginatedFetch.js';
import {DeletePermissionItemInput} from '../../permissionItems/deleteItems/types.js';
import {
  PermissionItemTargets,
  getPermissionItemTargets,
} from '../../permissionItems/getPermissionItemTargets.js';
import {queueJobs} from '../queueJobs.js';

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

  const {targetList} = targets.getByTarget(item || []);
  const idList = extractResourceIdList(targetList);

  if (idList.length) {
    query.targetId = {$in: idList};
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
  return kIjxSemantic.utils().withTxn(async opts => {
    const items = await kIjxSemantic
      .permissionItem()
      .getManyByQuery(args.query, {
        page,
        pageSize,
        projection: {resourceId: kIncludeInProjection},
        ...opts,
      });
    await kIjxSemantic
      .permissionItem()
      .updateManyByQuery(
        {resourceId: {$in: extractResourceIdList(items)}},
        {isDeleted: true, deletedAt: getTimestamp(), deletedBy: args.agent},
        opts
      );

    return items;
  });
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

export async function runDeletePermissionItemsJob(
  job: Job<DeletePermissionItemInput>
) {
  assert(job.type === kJobType.deletePermissionItem);

  const workspaceId = job.workspaceId;
  const item: DeletePermissionItemInput = job.params;

  appAssert(workspaceId, 'workspaceId not present in job');
  appAssert(job.createdBy, 'agent not present in job');

  const [workspace, agent] = await Promise.all([
    kIjxSemantic.workspace().getOneById(workspaceId),
    kIjxUtils.session().getAgentByAgentTokenId(job.createdBy.agentTokenId),
  ]);
  appAssert(workspace, 'workspace not found');

  const targets = await getPermissionItemTargets(
    agent,
    workspace,
    item,
    kFimidaraPermissionActions.updatePermission
  );

  const query = deletePermissionItemInputToQuery(workspaceId, item, targets);

  if (query) {
    await paginatedFetch<FetchArgs, FetchResult>({
      args: {
        workspaceId,
        query,
        agent,
        jobId: job.resourceId,
        shard: job.shard,
      },
      getFn: getPermissionItemsByQuery,
      processFn: processPermissionItems,
    });
  }
}
