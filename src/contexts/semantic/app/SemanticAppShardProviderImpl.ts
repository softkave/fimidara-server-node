import {first} from 'lodash-es';
import {AppShard} from '../../../definitions/app.js';
import {kFimidaraResourceType} from '../../../definitions/system.js';
import {waitTimeout} from '../../../utils/fns.js';
import {newResource} from '../../../utils/resource.js';
import {DataQuery} from '../../data/types.js';
import {kIjxSemantic} from '../../ijx/injectables.js';
import {
  SemanticBaseProvider,
  addIsDeletedIntoQuery,
} from '../SemanticBaseProvider.js';
import {
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
} from '../types.js';
import {SemanticAppShardProvider} from './types.js';

export class SemanticAppShardProviderImpl
  extends SemanticBaseProvider<AppShard>
  implements SemanticAppShardProvider
{
  async acquireShard(
    acceptanceKey: string,
    maxOccupantCount: number,
    appId: string,
    retryGetAvailableShardTimeoutMs: number,
    opts: SemanticProviderMutationParams
  ): Promise<string> {
    let shards = await this.getAvailableShards(
      acceptanceKey,
      maxOccupantCount,
      /** count */ 1,
      opts
    );
    let shard = first(shards);

    if (!shard) {
      await waitTimeout(retryGetAvailableShardTimeoutMs);
      shards = await this.getAvailableShards(
        acceptanceKey,
        maxOccupantCount,
        /** count */ 1,
        opts
      );
      shard = first(shards);
    }

    if (!shard) {
      shard = newResource<AppShard>(kFimidaraResourceType.appShard, {
        acceptanceKey,
        occupantCount: 1,
        startedByAppId: appId,
      });
      await this.data.insertItem(shard, opts);
    }

    return shard.resourceId;
  }

  async dropShard(
    shardId: string,
    opts?: SemanticProviderMutationParams
  ): Promise<void> {
    await kIjxSemantic.utils().withTxn(async opts => {
      const shard = (await this.getOneById(shardId, {
        ...opts,
        projection: {occupantCount: true},
      })) as Pick<AppShard, 'occupantCount'> | null;

      if (!shard) {
        return;
      }

      await this.updateOneById(
        shardId,
        {occupantCount: shard.occupantCount - 1},
        opts
      );
    }, opts);
  }

  async getEmptyShards(
    acceptanceKey: string,
    count: number,
    opts?: SemanticProviderQueryListParams<AppShard> | undefined
  ): Promise<AppShard[]> {
    const query = addIsDeletedIntoQuery<DataQuery<AppShard>>(
      {acceptanceKey, occupantCount: 0},
      opts?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, {
      ...opts,
      sort: {createdAt: 'desc'},
      pageSize: count,
      page: 0,
    });
  }

  async getAvailableShards(
    acceptanceKey: string,
    maxOccupantCount: number,
    count: number,
    opts: SemanticProviderQueryListParams<AppShard>
  ) {
    const query = addIsDeletedIntoQuery<DataQuery<AppShard>>(
      {acceptanceKey, occupantCount: {$lt: maxOccupantCount}},
      opts?.includeDeleted || false
    );
    return await this.data.getManyByQuery(query, {
      ...opts,
      sort: {createdAt: 'desc'},
      pageSize: count,
      page: 0,
    });
  }
}
