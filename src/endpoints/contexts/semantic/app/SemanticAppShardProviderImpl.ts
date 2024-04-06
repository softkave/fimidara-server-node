import {first} from 'lodash';
import {AppShard} from '../../../../definitions/app';
import {kFimidaraResourceType} from '../../../../definitions/system';
import {waitTimeout} from '../../../../utils/fns';
import {newResource} from '../../../../utils/resource';
import {kSemanticModels} from '../../injection/injectables';
import {DataSemanticBaseProvider} from '../DataSemanticDataAccessBaseProvider';
import {SemanticProviderMutationTxnOptions, SemanticProviderTxnOptions} from '../types';
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
    opts: SemanticProviderMutationTxnOptions
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
    opts?: SemanticProviderMutationTxnOptions
  ): Promise<void> {
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
    opts?: SemanticProviderTxnOptions | undefined
  ): Promise<AppShard[]> {
    return await this.data.getManyByQuery(
      {acceptanceKey, occupantCount: 0},
      {...opts, sort: {createdAt: 'desc'}, pageSize: count, page: 0}
    );
  }

  async getAvailableShards(
    acceptanceKey: string,
    maxOccupantCount: number,
    count: number,
    opts: SemanticProviderMutationTxnOptions
  ) {
    return await this.data.getManyByQuery(
      {acceptanceKey, occupantCount: {$lt: maxOccupantCount}},
      {...opts, sort: {createdAt: 'desc'}, pageSize: count, page: 0}
    );
  }
}
