import {DisposableResource} from 'softkave-js-utils';
import {AppQuery} from '../../contexts/data/types.js';
import {
  kSemanticModels,
  kUtilsInjectables,
} from '../../contexts/injection/injectables.js';
import {SemanticProviderMutationParams} from '../../contexts/semantic/types.js';
import {App, AppShardId, AppType} from '../../definitions/app.js';
import {kFimidaraResourceType} from '../../definitions/system.js';
import {getTimestamp} from '../../utils/dateFns.js';
import {newResource} from '../../utils/resource.js';
import {kAppConstants} from './constants.js';

// type ShardedDbResourceMigrationFn = AnyFn<
//   [
//     /** fromShardId */ AppShardId,
//     /** toShardId */ AppShardId,
//     SemanticProviderMutationParams,
//   ],
//   Promise<void>
// >;
// type ShardedDbResourceMigrationFnMap = {
//   [K in FimidaraResourceType]: FimidaraTypeToTSType<K> extends {shard?: AppShardId}
//     ? ShardedDbResourceMigrationFn
//     : null;
// };

// const migrationFnMap: ShardedDbResourceMigrationFnMap = {
//   [kFimidaraResourceType.All]: null,
//   [kFimidaraResourceType.System]: null,
//   [kFimidaraResourceType.Public]: null,
//   [kFimidaraResourceType.Workspace]: null,
//   [kFimidaraResourceType.CollaborationRequest]: null,
//   [kFimidaraResourceType.AgentToken]: null,
//   [kFimidaraResourceType.PermissionGroup]: null,
//   [kFimidaraResourceType.PermissionItem]: null,
//   [kFimidaraResourceType.Folder]: null,
//   [kFimidaraResourceType.File]: null,
//   [kFimidaraResourceType.User]: null,
//   [kFimidaraResourceType.Tag]: null,
//   [kFimidaraResourceType.AssignedItem]: null,
//   [kFimidaraResourceType.UsageRecord]: null,
//   [kFimidaraResourceType.EndpointRequest]: null,
//   [kFimidaraResourceType.PresignedPath]: null,
//   [kFimidaraResourceType.FileBackendConfig]: null,
//   [kFimidaraResourceType.FileBackendMount]: null,
//   [kFimidaraResourceType.ResolvedMountEntry]: null,
//   [kFimidaraResourceType.emailBlocklist]: null,
//   [kFimidaraResourceType.emailMessage]: null,
//   [kFimidaraResourceType.appShard]: null,
//   [kFimidaraResourceType.App]: noopAsync,
//   [kFimidaraResourceType.Job]: (fromShardId, toShardId, opts) =>
//     kSemanticModels.job().migrateShard(fromShardId, toShardId, opts),
// };

export interface FimidaraAppParams {
  shard: AppShardId;
  appId: string;
  type: AppType;
  heartbeatInterval?: number;
  activeAppHeartbeatDelayFactor?: number;
}

export class FimidaraApp implements DisposableResource {
  protected recordHeartbeatIntervalHandle: NodeJS.Timeout | undefined;
  protected heartbeatInterval: number;
  protected shard: AppShardId;
  protected appId: string;
  protected type: AppType;
  // protected acceptanceKey: string;
  // protected shardMaxOccupantCount: number;
  // protected retryGetAvailableShardTimeoutMs: number;
  protected activeAppIdList: string[] = [];

  /** By what factor is heartbeat interval multiplied by to determine a runner
   * is alive or not. */
  protected activeAppHeartbeatDelayFactor: number;

  constructor(params: FimidaraAppParams) {
    this.appId = params.appId;
    this.type = params.type;
    this.shard = params.shard;
    this.heartbeatInterval =
      params.heartbeatInterval || kAppConstants.heartbeatInterval;
    this.activeAppHeartbeatDelayFactor =
      params.activeAppHeartbeatDelayFactor ||
      kAppConstants.activeAppHeartbeatDelayFactor;
  }

  async startApp() {
    await kSemanticModels.utils().withTxn(async opts => {
      // await this.acquireShard(opts);
      await this.insertAppInDB(opts);
    });
    this.startHeartbeat();
  }

  async dispose() {
    this.stopHeartbeat();
  }

  getShard() {
    return this.shard;
  }

  getActiveAppIdList() {
    return this.activeAppIdList;
  }

  protected startHeartbeat() {
    if (!this.recordHeartbeatIntervalHandle) {
      this.recordHeartbeatIntervalHandle = setInterval(() => {
        kUtilsInjectables
          .promises()
          .callAndForget(() => this.recordInstanceHeartbeat());
        kUtilsInjectables
          .promises()
          .callAndForget(() => this.refreshActiveAppIdList());
      }, this.heartbeatInterval);
    }
  }

  protected stopHeartbeat() {
    if (this.recordHeartbeatIntervalHandle) {
      clearInterval(this.recordHeartbeatIntervalHandle);
      this.recordHeartbeatIntervalHandle = undefined;
    }
  }

  protected recordInstanceHeartbeat = async () => {
    await kSemanticModels.utils().withTxn(async opts => {
      await kSemanticModels
        .app()
        .updateOneById(this.appId, {lastUpdatedAt: getTimestamp()}, opts);
    });
  };

  protected async insertAppInDB(opts: SemanticProviderMutationParams) {
    // const config = kUtilsInjectables.suppliedConfig();
    // const serverInfo = await getServerInfo({
    //   httpPort: config.httpPort,
    //   httpsPort: config.httpsPort,
    // });

    const app = newResource<App>(kFimidaraResourceType.App, {
      // ...serverInfo,
      type: this.type,
      shard: this.shard,
      resourceId: this.appId,
    });
    await kSemanticModels.app().insertItem(app, opts);
  }

  // protected async acquireShard(opts: SemanticProviderMutationParams) {
  //   this.shard = await kSemanticModels
  //     .appShard()
  //     .acquireShard(
  //       this.acceptanceKey,
  //       this.shardMaxOccupantCount,
  //       this.appId,
  //       this.retryGetAvailableShardTimeoutMs,
  //       opts
  //     );
  // }

  protected async refreshActiveAppIdList() {
    const activeFromMs =
      getTimestamp() -
      this.heartbeatInterval * this.activeAppHeartbeatDelayFactor;
    const appQuery: AppQuery = {
      lastUpdatedAt: {$gte: activeFromMs},
      shard: this.shard,
    };
    const app = await kSemanticModels.app().getManyByQuery(appQuery);
    this.activeAppIdList = app.map(runner => runner.resourceId);
  }
}
