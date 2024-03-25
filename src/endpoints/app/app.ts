import {kAppConstants} from './constants';

export class FimidaraApp {
  protected recordHeartbeatIntervalHandle: NodeJS.Timeout | undefined;
  protected heartbeatInterval: number = kAppConstants.heartbeatInterval;
  // protected appId: string;
  // protected type: AppType;
  // protected shard: AppShard;

  // async start() {
  //   await this.insertAppInDB();
  //   this.startHeartbeat();
  // }

  // stop() {
  //   this.stopHeartbeat();
  // }

  // protected startHeartbeat() {
  //   if (!this.recordHeartbeatIntervalHandle) {
  //     this.recordHeartbeatIntervalHandle = setInterval(
  //       this.recordInstanceHeartbeat,
  //       this.heartbeatInterval
  //     );
  //   }
  // }

  // protected stopHeartbeat() {
  //   if (this.recordHeartbeatIntervalHandle) {
  //     clearInterval(this.recordHeartbeatIntervalHandle);
  //     this.recordHeartbeatIntervalHandle = undefined;
  //   }
  // }

  // protected recordInstanceHeartbeat = async () => {
  //   await kSemanticModels.utils().withTxn(async opts => {
  //     await kSemanticModels
  //       .app()
  //       .updateOneById(this.appId, {lastUpdatedAt: getTimestamp()}, opts);
  //   }, /** reuseTxn */ false);
  // };

  // protected async insertAppInDB() {
  //   const config = kUtilsInjectables.suppliedConfig();
  //   const serverInfo = await getServerInfo({
  //     httpPort: config.httpPort,
  //     httpsPort: config.httpsPort,
  //   });

  //   await kSemanticModels.utils().withTxn(async opts => {
  //     await kSemanticModels.app().insertItem(
  //       newResource<App>(kFimidaraResourceType.App, {
  //         ...serverInfo,
  //         type: this.type,
  //         shard: this.shard,
  //         resourceId: this.appId,
  //       }),
  //       opts
  //     );
  //   }, /** reuseTxn */ true);
  // }
}
