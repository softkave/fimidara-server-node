import {App, AppShard, AppShardId} from '../../../definitions/app.js';
import {
  SemanticBaseProviderType,
  SemanticProviderMutationParams,
  SemanticProviderQueryListParams,
  SemanticProviderQueryParams,
} from '../types.js';

export interface SemanticAppShardProvider
  extends SemanticBaseProviderType<AppShard> {
  acquireShard(
    acceptanceKey: string,
    maxOccupantCount: number,
    appId: string,
    retryGetAvailableShardTimeoutMs: number,
    opts: SemanticProviderMutationParams
  ): Promise<string>;
  dropShard(
    shardId: AppShardId,
    opts?: SemanticProviderMutationParams
  ): Promise<void>;
  getEmptyShards(
    acceptanceKey: string,
    count: number,
    opts?: SemanticProviderQueryListParams<AppShard>
  ): Promise<AppShard[]>;
}

export interface ISemanticAppProvider extends SemanticBaseProviderType<App> {
  getLatestAppInstanceForServerId(
    serverId: string,
    opts?: SemanticProviderQueryParams<App>
  ): Promise<App | null>;
}
