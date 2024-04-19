import {first} from 'lodash';
import {AppShard} from '../../../../definitions/app';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {waitTimeout} from '../../../../utils/fns';
import {newResource} from '../../../../utils/resource';
import {DataQuery} from '../../data/types';
import {kSemanticModels} from '../../injection/injectables';
import {
  DataSemanticBaseProvider,
  addIsDeletedIntoQuery,
} from '../DataSemanticDataAccessBaseProvider';
import {SemanticProviderMutationParams, SemanticProviderQueryListParams} from '../types';
import {SemanticAppShardProvider} from './types';

export class SemanticAppShardProviderImpl
  extends DataSemanticBaseProvider<AppShard>
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

  async dropShard(shardId: string, opts?: SemanticProviderMutationParams): Promise<void> {
    await kSemanticModels.utils().withTxn(
      async opts => {
        const shard = (await this.getOneById(shardId, {
          ...opts,
          projection: {occupantCount: true},
        })) as Pick<AppShard, 'occupantCount'> | null;

        if (!shard) {
          return;
        }

        await this.updateOneById(shardId, {occupantCount: shard.occupantCount - 1}, opts);
      },
      /** reuseAsyncLocalTxn */ false,
      opts
    );
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
