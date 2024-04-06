import {AppShard, AppShardId} from '../../../../definitions/app';
import {
  SemanticBaseProviderType,
  SemanticProviderMutationTxnOptions,
  SemanticProviderTxnOptions,
} from '../types';

export interface SemanticAppShardProvider extends SemanticBaseProviderType<AppShard> {
  acquireShard(
    acceptanceKey: string,
    maxOccupantCount: number,
    appId: string,
    retryGetAvailableShardTimeoutMs: number,
    opts: SemanticProviderMutationTxnOptions
  ): Promise<string>;
  dropShard(
    shardId: AppShardId,
    opts?: SemanticProviderMutationTxnOptions
  ): Promise<void>;
  getEmptyShards(
    acceptanceKey: string,
    count: number,
    opts?: SemanticProviderTxnOptions
  ): Promise<AppShard[]>;
}
